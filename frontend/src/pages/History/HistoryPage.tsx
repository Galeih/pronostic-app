import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userService, type HistoryItem } from '../../services/userService'
import Navbar from '../../components/layout/Navbar'

type Filter = 'all' | 'won' | 'lost' | 'pending' | 'created'

const STATUS_LABELS: Record<string, string> = {
  Draft:              'Brouillon',
  Open:               'En cours',
  VoteClosed:         'Votes fermes',
  AwaitingResolution: 'En attente',
  Resolved:           'Termine',
  Archived:           'Archive',
  Cancelled:          'Annule',
}

const STATUS_COLORS: Record<string, string> = {
  Draft:              'text-gray-500 bg-gray-800',
  Open:               'text-green-400 bg-green-900/30',
  VoteClosed:         'text-yellow-400 bg-yellow-900/30',
  AwaitingResolution: 'text-orange-400 bg-orange-900/30',
  Resolved:           'text-violet-400 bg-violet-900/30',
  Archived:           'text-gray-500 bg-gray-800',
  Cancelled:          'text-red-400 bg-red-900/30',
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const isResolved = item.status === 'Resolved'
  const won  = item.myVote?.isCorrect === true
  const lost = item.myVote?.isCorrect === false

  return (
    <Link
      to={`/p/${item.shareCode}${isResolved ? '/result' : ''}`}
      className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition line-clamp-2 leading-snug">
            {item.question}
          </p>

          {item.myVote?.optionLabel && (
            <p className="text-xs text-gray-500 mt-1.5">
              Mon vote :{' '}
              <span className={`font-medium ${won ? 'text-green-400' : lost ? 'text-red-400' : 'text-gray-400'}`}>
                {item.myVote.optionLabel}
              </span>
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${STATUS_COLORS[item.status] ?? ''}`}>
              {STATUS_LABELS[item.status] ?? item.status}
            </span>
            {item.isCreator && (
              <span className="text-xs text-violet-400 bg-violet-900/20 rounded-full px-2.5 py-0.5">
                Createur
              </span>
            )}
            <span className="text-xs text-gray-600">
              {item.participantCount} participants
            </span>
            <span className="text-xs text-gray-600">
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          {isResolved && item.myVote && (
            <div className={`text-lg font-black ${won ? 'text-green-400' : 'text-red-400'}`}>
              {won ? `+${item.myVote.rewardPoints}` : 'X'}
            </div>
          )}
          {isResolved && item.myVote && (
            <p className="text-xs text-gray-600">{won ? 'pts' : 'rate'}</p>
          )}
          {!isResolved && (
            <span className="text-gray-600 text-xs">-</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function HistoryPage() {
  const [items, setItems]       = useState<HistoryItem[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [filter, setFilter]     = useState<Filter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const PAGE_SIZE = 20

  useEffect(() => {
    setIsLoading(true)
    setItems([])
    setPage(1)
    userService.getMyHistory(1, PAGE_SIZE)
      .then(res => {
        setItems(res.items)
        setTotal(res.total)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const loadMore = async () => {
    setIsLoadingMore(true)
    const nextPage = page + 1
    const res = await userService.getMyHistory(nextPage, PAGE_SIZE)
    setItems(prev => [...prev, ...res.items])
    setPage(nextPage)
    setIsLoadingMore(false)
  }

  const filtered = items.filter(item => {
    if (filter === 'all')     return true
    if (filter === 'won')     return item.myVote?.isCorrect === true
    if (filter === 'lost')    return item.myVote?.isCorrect === false
    if (filter === 'pending') return item.status !== 'Resolved' && item.status !== 'Archived'
    if (filter === 'created') return item.isCreator
    return true
  })

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',     label: 'Tout' },
    { key: 'won',     label: 'Gagnes' },
    { key: 'lost',    label: 'Perdus' },
    { key: 'pending', label: 'En cours' },
    { key: 'created', label: 'Crees' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Historique</h1>
            <p className="text-gray-500 text-sm mt-0.5">{total} pronostic{total > 1 ? 's' : ''} au total</p>
          </div>
          <Link
            to="/create"
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
          >
            + Creer
          </Link>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                filter === f.key
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400 font-semibold mb-1">Aucun pronostic trouve</p>
            <p className="text-gray-600 text-sm mb-5">
              {filter === 'all'
                ? "Tu n'as pas encore participe a des pronostics."
                : 'Aucun pronostic ne correspond a ce filtre.'}
            </p>
            {filter === 'all' && (
              <Link
                to="/create"
                className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition"
              >
                Creer mon premier pronostic
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filtered.map(item => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>

            {items.length < total && filter === 'all' && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                {isLoadingMore && (
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
                {isLoadingMore ? 'Chargement...' : `Charger plus (${total - items.length} restants)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
