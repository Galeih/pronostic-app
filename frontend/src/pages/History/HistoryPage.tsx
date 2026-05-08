import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userService, type HistoryItem } from '../../services/userService'
import Navbar from '../../components/layout/Navbar'

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }

type Filter = 'all' | 'won' | 'lost' | 'pending' | 'created'

const STATUS_LABELS: Record<string, string> = {
  Draft:              'Brouillon',
  Open:               'En cours',
  VoteClosed:         'Votes fermés',
  AwaitingResolution: 'En attente',
  Resolved:           'Terminé',
  Archived:           'Archivé',
  Cancelled:          'Annulé',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Draft:              { bg: '#0e0c08', color: '#3a2d10' },
  Open:               { bg: '#0e1a0a', color: '#5aaa30' },
  VoteClosed:         { bg: '#1a1408', color: '#c8880c' },
  AwaitingResolution: { bg: '#1a1208', color: '#e6a817' },
  Resolved:           { bg: '#1a1a08', color: '#f5c842' },
  Archived:           { bg: '#0e0c08', color: '#2a2218' },
  Cancelled:          { bg: '#1a0808', color: '#e05050' },
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const isResolved   = item.status === 'Resolved'
  const isPending    = !isResolved && item.status !== 'Cancelled'
  const won          = item.myVote?.isCorrect === true
  const lost         = item.myVote?.isCorrect === false
  const hasSecondVote = !!item.myVote?.secondOptionLabel
  const sc           = STATUS_COLORS[item.status] ?? STATUS_COLORS.Draft

  // Couleur du vote affiché
  const voteColor = won ? '#a0ff70' : lost ? '#e05050' : '#c8880c'

  return (
    <Link
      to={`/p/${item.shareCode}${isResolved ? '/result' : isPending ? '/waiting' : ''}`}
      className="block p-4 rounded transition"
      style={{ background: '#161209', border: '1px solid #3a2d10' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#6b5010')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#3a2d10')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">

          {/* Question */}
          <p className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: '#f0dfa8', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            « {item.question} »
          </p>

          {/* Vote(s) */}
          {item.myVote?.optionLabel && (
            <div className="mt-1.5 space-y-0.5">
              <p className="text-xs" style={{ color: '#6b5010' }}>
                {hasSecondVote ? 'Vote principal' : 'Ton choix'} :{' '}
                <span style={{ color: voteColor, fontFamily: '"Cinzel", serif' }}>
                  {item.myVote.optionLabel}
                </span>
              </p>
              {hasSecondVote && (
                <p className="text-xs" style={{ color: '#6b5010' }}>
                  Second vote :{' '}
                  <span style={{ color: '#a0a0f0', fontFamily: '"Cinzel", serif' }}>
                    {item.myVote.secondOptionLabel}
                  </span>
                  {item.myVote.secondOptionId && won && (
                    <span className="ml-1" style={{ color: '#a0ff70' }}>✦</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Badges de statut */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-medium rounded-full px-2.5 py-0.5"
              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}44`, fontFamily: '"Cinzel", serif', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
              {STATUS_LABELS[item.status] ?? item.status}
            </span>
            {item.isCreator && (
              <span className="text-xs rounded-full px-2.5 py-0.5"
                style={{ background: '#1e1810', border: '1px solid #c8880c44', color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.65rem' }}>
                Créateur
              </span>
            )}
            {hasSecondVote && (
              <span className="text-xs rounded-full px-2 py-0.5"
                style={{ background: '#1a1a2e', border: '1px solid #4a4a8a44', color: '#8080d0', fontFamily: '"Cinzel", serif', fontSize: '0.65rem' }}>
                Double vote
              </span>
            )}
            <span className="text-xs" style={{ color: '#3a2d10' }}>{item.participantCount} initiés</span>
            <span className="text-xs" style={{ color: '#2a2218' }}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        {/* Score à droite */}
        <div className="flex-shrink-0 text-right min-w-[40px]">
          {isResolved && item.myVote && (
            <>
              <p className="text-lg font-black" style={{ color: won ? '#a0ff70' : '#e05050', fontFamily: '"Cinzel", serif' }}>
                {won ? `+${item.myVote.rewardPoints}` : '✗'}
              </p>
              <p className="text-xs" style={{ color: '#3a2d10' }}>{won ? 'pts' : 'raté'}</p>
            </>
          )}
          {isResolved && !item.myVote && (
            <p className="text-xs" style={{ color: '#3a2d10' }}>Créé</p>
          )}
          {!isResolved && (
            <span className="text-xs" style={{ color: '#2a2218' }}>—</span>
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
    setIsLoading(true); setItems([]); setPage(1)
    userService.getMyHistory(1, PAGE_SIZE)
      .then(res => { setItems(res.items); setTotal(res.total) })
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
    { key: 'won',     label: '✦ Gagnés' },
    { key: 'lost',    label: '✗ Perdus' },
    { key: 'pending', label: '⏳ En cours' },
    { key: 'created', label: '◈ Créés' },
  ]

  return (
    <div style={pageStyle}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
              Archives
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#6b5010', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
              {total} prophétie{total > 1 ? 's' : ''} au total
            </p>
          </div>
          <Link
            to="/create"
            className="font-semibold text-sm px-4 py-2 rounded transition"
            style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842', letterSpacing: '0.06em' }}
          >
            ✦ Invoquer
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition"
              style={{
                background: filter === f.key ? '#1e1810' : '#0e0c08',
                border: `1px solid ${filter === f.key ? '#c8880c' : '#3a2d10'}`,
                color: filter === f.key ? '#f5c842' : '#6b5010',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.7rem',
                letterSpacing: '0.04em',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3" style={{ color: '#3a2d10' }}>◈</p>
            <p className="font-semibold mb-1" style={{ fontFamily: '"Cinzel", serif', color: '#6b5010' }}>
              Aucune prophétie trouvée
            </p>
            <p className="text-sm mb-5" style={{ color: '#3a2d10' }}>
              {filter === 'all'
                ? "Tu n'as pas encore participé à des pronostics."
                : 'Aucune ne correspond à ce filtre.'}
            </p>
            {filter === 'all' && (
              <Link
                to="/create"
                className="inline-block font-semibold px-6 py-2.5 rounded text-sm transition"
                style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842' }}
              >
                Invoquer ma première prophétie
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filtered.map(item => <HistoryCard key={item.id} item={item} />)}
            </div>

            {items.length < total && filter === 'all' && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full mt-6 py-3 rounded text-sm transition flex items-center justify-center gap-2"
                style={{ background: '#161209', border: '1px solid #3a2d10', color: '#6b5010', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6b5010'; (e.currentTarget as HTMLElement).style.color = '#c8880c' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a2d10'; (e.currentTarget as HTMLElement).style.color = '#6b5010' }}
              >
                {isLoadingMore && (
                  <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: '#6b5010', borderTopColor: 'transparent' }} />
                )}
                {isLoadingMore ? 'Consultation des archives...' : `Charger la suite (${total - items.length} restantes)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
