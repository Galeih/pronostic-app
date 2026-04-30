import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { useAuth } from '../../context/AuthContext'
import type { Prediction } from '../../types'

const STATUS_LABELS: Record<string, string> = {
  Draft:              'Brouillon',
  Open:               'Votes ouverts',
  VoteClosed:         'Votes fermés',
  AwaitingResolution: 'En attente de résolution',
  Resolved:           'Résolu',
  Archived:           'Archivé',
  Cancelled:          'Annulé',
}

const STATUS_COLORS: Record<string, string> = {
  Draft:              'text-gray-400 bg-gray-800 border-gray-700',
  Open:               'text-green-400 bg-green-900/30 border-green-800',
  VoteClosed:         'text-yellow-400 bg-yellow-900/30 border-yellow-800',
  AwaitingResolution: 'text-orange-400 bg-orange-900/30 border-orange-800',
  Resolved:           'text-violet-400 bg-violet-900/30 border-violet-800',
  Archived:           'text-gray-500 bg-gray-800 border-gray-700',
  Cancelled:          'text-red-400 bg-red-900/30 border-red-800',
}

function formatDeadline(dateStr: string): string {
  const date = new Date(dateStr)
  const diff = date.getTime() - Date.now()
  if (diff <= 0) return 'Expiré'
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return `${Math.floor(diff / 60000)} min restantes`
  if (hours < 24) return `${hours}h restantes`
  return `${Math.floor(hours / 24)}j restants`
}

export default function PredictionDetailPage() {
  const { shareCode }     = useParams<{ shareCode: string }>()
  const navigate          = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)

  useEffect(() => {
    if (!shareCode) return
    predictionService
      .getByShareCode(shareCode)
      .then(setPrediction)
      .catch(() => setError('Pronostic introuvable ou non publié.'))
      .finally(() => setIsLoading(false))
  }, [shareCode])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !prediction) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-white mb-2">Pronostic introuvable</h1>
          <p className="text-gray-400 mb-6">{error ?? 'Ce lien n est pas valide.'}</p>
          <Link to="/" className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  const isCreator  = user?.id === prediction.creatorId
  const hasVoted   = !!prediction.myVote
  const isOpen     = prediction.status === 'Open'
  const isResolved = prediction.status === 'Resolved'
  const canVote    = isOpen && !hasVoted
  const canResolve = isCreator && (
    prediction.status === 'VoteClosed' || prediction.status === 'AwaitingResolution'
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm">&larr; Accueil</Link>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg transition"
          >
            {copied ? 'Copié !' : 'Partager'}
          </button>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">

          <div className={`px-5 py-2.5 border-b text-xs font-semibold flex items-center justify-between ${STATUS_COLORS[prediction.status]}`}>
            <span>{STATUS_LABELS[prediction.status] ?? prediction.status}</span>
            {isOpen && (
              <span className="text-xs opacity-80">{formatDeadline(prediction.voteDeadline)}</span>
            )}
          </div>

          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Pronostic de <span className="text-violet-400 font-medium">{prediction.creatorName}</span>
              </p>
              <h1 className="text-2xl font-extrabold text-white leading-snug">
                {prediction.question}
              </h1>
              {prediction.context && (
                <p className="text-gray-400 text-sm mt-2 italic">{prediction.context}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="bg-gray-800 rounded-full px-3 py-1">
                👥 {prediction.participantCount} participant{prediction.participantCount !== 1 ? 's' : ''}
              </span>
              <span className="bg-gray-800 rounded-full px-3 py-1">
                🏆 {prediction.baseReward} pts
              </span>
              {prediction.allowBoosts && (
                <span className="bg-gray-800 rounded-full px-3 py-1">Boosts actifs</span>
              )}
            </div>

            {hasVoted && !isResolved && (
              <div className="bg-violet-900/20 border border-violet-700/40 rounded-xl px-4 py-3 text-sm text-violet-300">
                Tu as voté pour :{' '}
                <span className="font-semibold text-violet-200">
                  {prediction.options.find(o => o.id === prediction.myVote?.optionId)?.label ?? '—'}
                </span>
              </div>
            )}

            <div className="space-y-2">
              {prediction.options
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(option => {
                  const isMyVote   = prediction.myVote?.optionId === option.id
                  const isCorrect  = isResolved && option.id === prediction.correctOptionId
                  const isWrong    = isResolved && option.id !== prediction.correctOptionId

                  return (
                    <div
                      key={option.id}
                      className={`relative rounded-xl border px-4 py-3 transition ${
                        isCorrect ? 'bg-green-900/30 border-green-700 text-green-300' :
                        isWrong   ? 'bg-gray-800/50 border-gray-700/50 text-gray-500' :
                        isMyVote  ? 'bg-violet-900/30 border-violet-700 text-violet-200' :
                                    'bg-gray-800 border-gray-700 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCorrect && <span>✅</span>}
                          {isMyVote && !isResolved && <span className="text-violet-400">→</span>}
                          <div>
                            <p className="font-medium text-sm">{option.label}</p>
                            {option.description && (
                              <p className="text-xs opacity-60 mt-0.5">{option.description}</p>
                            )}
                          </div>
                        </div>
                        {isResolved && option.votePercentage !== undefined && (
                          <div className="text-right ml-4 flex-shrink-0">
                            <p className={`text-sm font-bold ${isCorrect ? 'text-green-400' : 'text-gray-500'}`}>
                              {option.votePercentage}%
                            </p>
                            <p className="text-xs text-gray-600">{option.voteCount} vote{option.voteCount !== 1 ? 's' : ''}</p>
                          </div>
                        )}
                      </div>
                      {isResolved && option.votePercentage !== undefined && (
                        <div className="mt-2 h-1 rounded-full bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isCorrect ? 'bg-green-500' : 'bg-gray-600'}`}
                            style={{ width: `${option.votePercentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>

            {isResolved && prediction.myVote && (
              <div className={`rounded-xl px-5 py-4 border text-center ${
                prediction.myVote.isCorrect
                  ? 'bg-green-900/20 border-green-700/40 text-green-300'
                  : 'bg-red-900/20 border-red-700/40 text-red-300'
              }`}>
                <p className="text-2xl mb-1">{prediction.myVote.isCorrect ? '🎉' : '😬'}</p>
                <p className="font-bold">
                  {prediction.myVote.isCorrect
                    ? `Bien joué ! +${prediction.myVote.rewardPoints} pts`
                    : 'Raté cette fois...'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {canVote && (
                <button
                  onClick={() => navigate(`/p/${shareCode}/vote`)}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  Voter maintenant
                </button>
              )}
              {canResolve && (
                <button
                  onClick={() => navigate(`/p/${shareCode}/result`)}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  Révéler les résultats
                </button>
              )}
              {isCreator && prediction.status === 'Draft' && (
                <button
                  onClick={async () => {
                    await predictionService.publish(prediction.id)
                    setPrediction(prev => prev ? { ...prev, status: 'Open' } : prev)
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  Publier
                </button>
              )}
              {!isAuthenticated && canVote && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  <Link to="/login" className="text-violet-400 hover:underline">Connecte-toi</Link>{' '}
                  pour conserver ton historique et tes points.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
          <span>Votes fermés : {new Date(prediction.voteDeadline).toLocaleString('fr-FR')}</span>
          {prediction.revealDate && (
            <span>Révélation : {new Date(prediction.revealDate).toLocaleString('fr-FR')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
