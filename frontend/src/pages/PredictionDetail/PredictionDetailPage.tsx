import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { useAuth } from '../../context/AuthContext'
import type { Prediction } from '../../types'

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }
const cardStyle = { background: '#161209', border: '1px solid #6b5010', borderRadius: '6px' }

const STATUS_LABELS: Record<string, string> = {
  Draft:              'Brouillon',
  Open:               'Votes ouverts',
  VoteClosed:         'Votes fermés',
  AwaitingResolution: 'En attente',
  Resolved:           'Résolu',
  Archived:           'Archivé',
  Cancelled:          'Annulé',
}

const STATUS_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  Draft:              { bg: '#161209', border: '#3a2d10', color: '#6b5010' },
  Open:               { bg: '#0e1a0a', border: '#2a5a10', color: '#5aaa30' },
  VoteClosed:         { bg: '#1a1408', border: '#6b5010', color: '#c8880c' },
  AwaitingResolution: { bg: '#1a1208', border: '#8a5510', color: '#e6a817' },
  Resolved:           { bg: '#1a1a08', border: '#6b6010', color: '#f5c842' },
  Archived:           { bg: '#161209', border: '#2a2218', color: '#3a2d10' },
  Cancelled:          { bg: '#1a0808', border: '#6b2020', color: '#e05050' },
}

function formatDeadline(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Expiré'
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)} min restantes`
  if (h < 24) return `${h}h restantes`
  return `${Math.floor(h / 24)}j restants`
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
    predictionService.getByShareCode(shareCode)
      .then(setPrediction)
      .catch(() => setError('Pronostic introuvable ou non publié.'))
      .finally(() => setIsLoading(false))
  }, [shareCode])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return (
    <div style={pageStyle} className="flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
    </div>
  )

  if (error || !prediction) return (
    <div style={pageStyle} className="flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-4" style={{ color: '#c8880c' }}>✦</p>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>Pronostic introuvable</h1>
        <p className="text-sm mb-6" style={{ color: '#6b5010' }}>{error ?? 'Ce lien n\'est pas valide.'}</p>
        <Link to="/" className="font-semibold px-6 py-2.5 rounded text-sm transition"
          style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842' }}>
          Retour
        </Link>
      </div>
    </div>
  )

  const isCreator  = user?.id === prediction.creatorId
  const hasVoted   = !!prediction.myVote
  const isOpen     = prediction.status === 'Open'
  const isResolved = prediction.status === 'Resolved'
  const canVote    = isOpen && !hasVoted
  const canResolve = isCreator && (prediction.status === 'VoteClosed' || prediction.status === 'AwaitingResolution')
  const statusC    = STATUS_COLORS[prediction.status] ?? STATUS_COLORS.Draft

  return (
    <div style={pageStyle}>
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-sm transition" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
            ← Accueil
          </Link>
          <button onClick={copyLink} className="text-sm px-4 py-2 rounded transition"
            style={{ background: '#161209', border: '1px solid #6b5010', color: copied ? '#f5c842' : '#8a7a5a', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}>
            {copied ? '✓ Copié !' : '◈ Partager'}
          </button>
        </div>

        <div className="relative overflow-hidden rounded" style={cardStyle}>
          {/* Status bar */}
          <div className="px-5 py-2.5 border-b flex items-center justify-between"
            style={{ background: statusC.bg, borderColor: statusC.border }}>
            <span className="text-xs font-semibold" style={{ color: statusC.color, fontFamily: '"Cinzel", serif', letterSpacing: '0.08em' }}>
              {STATUS_LABELS[prediction.status] ?? prediction.status}
            </span>
            {isOpen && (
              <span className="text-xs" style={{ color: statusC.color, opacity: 0.8 }}>{formatDeadline(prediction.voteDeadline)}</span>
            )}
          </div>

          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
                Prophétie de <span style={{ color: '#c8880c' }}>{prediction.creatorName}</span>
              </p>
              <h1 className="text-2xl font-extrabold leading-snug" style={{ color: '#f0dfa8', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
                « {prediction.question} »
              </h1>
              {prediction.context && <p className="text-sm mt-2" style={{ color: '#6b5010' }}>{prediction.context}</p>}
            </div>

            <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#6b5010' }}>
              <span className="px-3 py-1 rounded-full" style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
                👥 {prediction.participantCount} initiés
              </span>
              <span className="px-3 py-1 rounded-full" style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
                ⚖ {prediction.baseReward} pts
              </span>
              {prediction.allowBoosts && (
                <span className="px-3 py-1 rounded-full" style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>Boosts actifs</span>
              )}
              {prediction.isAnonymous && (
                <span className="px-3 py-1 rounded-full flex items-center gap-1"
                  style={{ background: '#1a1208', border: '1px solid #c8880c', color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                  ◉ Prophétie Aveugle
                </span>
              )}
            </div>

            {hasVoted && !isResolved && (
              <div className="rounded px-4 py-3 text-sm" style={{ background: '#1e1810', border: '1px solid #c8880c' }}>
                Tu as choisi :{' '}
                <span className="font-semibold" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                  {prediction.options.find(o => o.id === prediction.myVote?.optionId)?.label ?? '—'}
                </span>
              </div>
            )}

            <div className="space-y-2">
              {prediction.options.slice().sort((a, b) => a.sortOrder - b.sortOrder).map(option => {
                const isMyVote  = prediction.myVote?.optionId === option.id
                const isCorrect = isResolved && option.id === prediction.correctOptionId
                const isWrong   = isResolved && option.id !== prediction.correctOptionId
                return (
                  <div
                    key={option.id}
                    className="relative rounded border px-4 py-3 transition"
                    style={{
                      background: isCorrect ? '#1a2810' : isMyVote && !isResolved ? '#1e1810' : '#0e0c08',
                      border: `1px solid ${isCorrect ? '#3a8a20' : isMyVote && !isResolved ? '#c8880c' : isWrong && isMyVote ? '#4a2020' : '#2a2218'}`,
                      opacity: isWrong && !isMyVote ? 0.7 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCorrect && <span style={{ color: '#a0ff70' }}>✦</span>}
                        {isMyVote && !isResolved && <span style={{ color: '#c8880c' }}>→</span>}
                        {isMyVote && isResolved && !isCorrect && <span style={{ color: '#e05050' }}>✗</span>}
                        <div>
                          <p className="font-medium text-sm" style={{
                            color: isCorrect ? '#a0ff70' : isMyVote && !isResolved ? '#f5c842' : '#9a8a64',
                            fontFamily: '"Cinzel", serif',
                          }}>
                            {option.label}
                          </p>
                          {option.description && <p className="text-xs mt-0.5" style={{ color: '#3a2d10' }}>{option.description}</p>}
                        </div>
                      </div>
                      {isResolved && option.votePercentage !== undefined && (
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: isCorrect ? '#a0ff70' : '#6b5010' }}>{option.votePercentage}%</p>
                          <p className="text-xs" style={{ color: '#3a2d10' }}>{option.voteCount} vote{option.voteCount !== 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>
                    {isResolved && option.votePercentage !== undefined && (
                      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#0a0906' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${option.votePercentage}%`, background: isCorrect ? 'linear-gradient(to right, #3a8a20, #a0ff70)' : '#3a2d10' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {isResolved && prediction.myVote && (
              <div className="rounded px-5 py-4 border text-center"
                style={{ background: prediction.myVote.isCorrect ? '#1a2810' : '#2a0c0c', border: `1px solid ${prediction.myVote.isCorrect ? '#3a8a20' : '#6b2020'}` }}>
                <p className="text-2xl mb-1">{prediction.myVote.isCorrect ? '✦' : '✗'}</p>
                <p className="font-bold" style={{ color: prediction.myVote.isCorrect ? '#a0ff70' : '#e05050', fontFamily: '"Cinzel", serif' }}>
                  {prediction.myVote.isCorrect ? `Prophétie accomplie ! +${prediction.myVote.rewardPoints} pts` : 'Orakl en a décidé autrement...'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {canVote && (
                <button onClick={() => navigate(`/p/${shareCode}/vote`)}
                  className="flex-1 font-bold py-3 rounded text-sm transition"
                  style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842', letterSpacing: '0.06em' }}>
                  ✦ Voter maintenant
                </button>
              )}
              {canResolve && (
                <button onClick={() => navigate(`/p/${shareCode}/result`)}
                  className="flex-1 font-bold py-3 rounded text-sm transition"
                  style={{ background: 'linear-gradient(135deg, #2a6010, #3a8a20)', color: '#d0ffa0', fontFamily: '"Cinzel", serif', border: '1px solid #5aaa30', letterSpacing: '0.06em' }}>
                  ⚖ Révéler les résultats
                </button>
              )}
              {isCreator && prediction.status === 'Draft' && (
                <button
                  onClick={async () => {
                    await predictionService.publish(prediction.id)
                    setPrediction(prev => prev ? { ...prev, status: 'Open' } : prev)
                  }}
                  className="flex-1 font-bold py-3 rounded text-sm transition"
                  style={{ background: 'linear-gradient(135deg, #2a6010, #3a8a20)', color: '#d0ffa0', fontFamily: '"Cinzel", serif', border: '1px solid #5aaa30' }}>
                  ✦ Publier
                </button>
              )}
              {!isAuthenticated && canVote && (
                <p className="text-xs text-center mt-1" style={{ color: '#6b5010' }}>
                  <Link to="/login" style={{ color: '#c8880c' }}>Connecte-toi</Link> pour conserver ton historique.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs" style={{ color: '#2a2218', fontFamily: '"Cinzel", serif' }}>
          <span>Votes fermés : {new Date(prediction.voteDeadline).toLocaleString('fr-FR')}</span>
          {prediction.revealDate && <span>Révélation : {new Date(prediction.revealDate).toLocaleString('fr-FR')}</span>}
        </div>
      </div>
    </div>
  )
}
