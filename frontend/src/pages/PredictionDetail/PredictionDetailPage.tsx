import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'
import type { Prediction } from '../../types'
import { usePageTitle } from '../../hooks/usePageTitle'

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }

const STATUS_LABELS: Record<string, string> = {
  Draft:              'Brouillon',
  Open:               'Votes ouverts',
  VoteClosed:         'Votes fermés',
  AwaitingResolution: 'En attente de révélation',
  Resolved:           'Prophétie accomplie',
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

// Normalise les dates sans indicateur de timezone → UTC
const normalizeDate = (s: string) =>
  s.endsWith('Z') || s.includes('+') || /[+-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z'

function formatDeadline(dateStr: string): string {
  const diff = new Date(normalizeDate(dateStr)).getTime() - Date.now()
  if (diff <= 0) return 'Expiré'
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)} min restantes`
  if (h < 24) return `${h}h restantes`
  return `${Math.floor(h / 24)}j restants`
}

// Comparaison GUID insensible à la casse
const eqId = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase()

export default function PredictionDetailPage() {
  const { shareCode }             = useParams<{ shareCode: string }>()
  const navigate                  = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  usePageTitle(prediction ? prediction.question : 'Pronostic')

  // ── Open Graph meta tags ──────────────────────────────────────────────────
  useEffect(() => {
    if (!prediction) return
    const url = window.location.href
    const title = `Orakl — ${prediction.question}`
    const desc = `Rejoins le pronostic et vote avant la deadline ! ${prediction.options?.map(o => o.label).join(' · ')}`

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('og:title',       title)
    setMeta('og:description', desc)
    setMeta('og:url',         url)
    setMeta('og:type',        'website')

    return () => {
      ;['og:title', 'og:description', 'og:url', 'og:type'].forEach(p => {
        document.querySelector(`meta[property="${p}"]`)?.remove()
      })
    }
  }, [prediction])

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

  const handlePublish = async () => {
    if (!prediction) return
    setIsPublishing(true)
    try {
      await predictionService.publish(prediction.id)
      setPrediction(prev => prev ? { ...prev, status: 'Open' } : prev)
    } finally { setIsPublishing(false) }
  }

  if (isLoading) return (
    <div style={pageStyle} className="flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
    </div>
  )

  if (error || !prediction) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <p className="text-5xl mb-4" style={{ color: '#c8880c' }}>✦</p>
          <h1 className="text-2xl font-bold mb-2"
            style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>Pronostic introuvable</h1>
          <p className="text-sm mb-6" style={{ color: '#6b5010' }}>{error ?? 'Ce lien n\'est pas valide.'}</p>
          <Link to="/" className="font-semibold px-6 py-2.5 rounded text-sm"
            style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842' }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )

  const isCreator   = eqId(user?.id, prediction.creatorId)
  const hasVoted    = !!prediction.myVote
  const isOpen      = prediction.status === 'Open'
  const isResolved  = prediction.status === 'Resolved'
  const isVoteClosed = prediction.status === 'VoteClosed' || prediction.status === 'AwaitingResolution'
  const isDraft     = prediction.status === 'Draft'
  const canVote     = isOpen && !hasVoted
  const canResolve  = isCreator && isVoteClosed
  const statusC     = STATUS_COLORS[prediction.status] ?? STATUS_COLORS.Draft

  const myPrimaryOption  = prediction.options.find(o => eqId(o.id, prediction.myVote?.optionId))
  const mySecondOption   = prediction.myVote?.secondOptionId
    ? prediction.options.find(o => eqId(o.id, prediction.myVote?.secondOptionId))
    : null
  const showVoteStats    = (isResolved || isVoteClosed) && prediction.options.some(o => o.votePercentage !== undefined)

  return (
    <div style={pageStyle}>
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between mb-5">
          <Link to="/" className="text-sm transition"
            style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
            ← Accueil
          </Link>
          <button onClick={copyLink} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded transition"
            style={{ background: '#161209', border: `1px solid ${copied ? '#f5c842' : '#6b5010'}`, color: copied ? '#f5c842' : '#8a7a5a', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}>
            {copied ? '✓ Lien copié !' : '◈ Partager ce pronostic'}
          </button>
        </div>

        {/* ── Carte principale ── */}
        <div className="relative rounded overflow-hidden shadow-2xl"
          style={{ background: '#161209', border: '1px solid #6b5010' }}>

          {/* Barre de statut */}
          <div className="px-5 py-3 border-b flex items-center justify-between gap-3"
            style={{ background: statusC.bg, borderColor: statusC.border }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest"
                style={{ color: statusC.color, fontFamily: '"Cinzel", serif', letterSpacing: '0.10em' }}>
                {STATUS_LABELS[prediction.status] ?? prediction.status}
              </span>
              {prediction.isAnonymous && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#1a1208', border: '1px solid #c8880c44', color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.6rem', letterSpacing: '0.06em' }}>
                  ◉ Aveugle
                </span>
              )}
            </div>
            {isOpen && (
              <span className="text-xs font-semibold" style={{ color: statusC.color }}>
                ⏳ {formatDeadline(prediction.voteDeadline)}
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">

            {/* ── Question ── */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
                Prophétie de <span style={{ color: '#c8880c' }}>{prediction.creatorName}</span>
              </p>
              <h1 className="text-2xl font-extrabold leading-snug"
                style={{ color: '#f0dfa8', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
                « {prediction.question} »
              </h1>
              {prediction.context && (
                <p className="text-sm mt-2 italic" style={{ color: '#6b5010' }}>{prediction.context}</p>
              )}
            </div>

            {/* ── Chips infos ── */}
            <div className="flex flex-wrap gap-2 text-xs" style={{ color: '#6b5010' }}>
              <span className="px-3 py-1 rounded-full" style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
                👥 {prediction.participantCount ?? 0} initié{(prediction.participantCount ?? 0) > 1 ? 's' : ''}
              </span>
              <span className="px-3 py-1 rounded-full" style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
                ⚖ {prediction.baseReward} pts en jeu
              </span>
              {prediction.allowBoosts && (
                <span className="px-3 py-1 rounded-full" style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
                  ✦ Boosts actifs
                </span>
              )}
              {isResolved && prediction.winnerCount !== undefined && (
                <span className="px-3 py-1 rounded-full"
                  style={{ background: '#1a2810', border: '1px solid #3a8a2044', color: '#a0ff70' }}>
                  🏆 {prediction.winnerCount} gagnant{prediction.winnerCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #3a2d10, transparent)' }} />

            {/* ── Mon vote (avant résolution) ── */}
            {hasVoted && !isResolved && myPrimaryOption && (
              <div className="rounded px-4 py-3 space-y-1" style={{ background: '#1e1810', border: '1px solid #c8880c44' }}>
                <p className="text-xs" style={{ color: '#6b5010' }}>Ton choix :</p>
                <p className="font-semibold text-sm" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                  ✦ {myPrimaryOption.label}
                </p>
                {mySecondOption && (
                  <p className="text-xs" style={{ color: '#8080d0' }}>
                    Second vote :{' '}
                    <span style={{ fontFamily: '"Cinzel", serif' }}>{mySecondOption.label}</span>
                  </p>
                )}
              </div>
            )}

            {/* ── Options ── */}
            <div className="space-y-2">
              {prediction.options.slice().sort((a, b) => a.sortOrder - b.sortOrder).map(option => {
                const isMyPrimary  = eqId(option.id, prediction.myVote?.optionId)
                const isMySecond   = eqId(option.id, prediction.myVote?.secondOptionId)
                const isCorrect    = isResolved && eqId(option.id, prediction.correctOptionId)
                const isWrong      = isResolved && !eqId(option.id, prediction.correctOptionId)
                const highlight    = isCorrect || (isMyPrimary && !isResolved)

                return (
                  <div key={option.id} className="rounded border transition"
                    style={{
                      background: isCorrect ? '#1a2810' : isMyPrimary && !isResolved ? '#1e1810' : '#0e0c08',
                      border: `1px solid ${isCorrect ? '#3a8a20' : isMyPrimary && !isResolved ? '#c8880c44' : isMySecond && !isResolved ? '#4a4a8a44' : '#2a2218'}`,
                      opacity: isWrong && !isMyPrimary && !isMySecond ? 0.6 : 1,
                    }}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Icône état */}
                          <div className="flex-shrink-0 w-5 text-center">
                            {isCorrect    && <span style={{ color: '#a0ff70' }}>✦</span>}
                            {isMyPrimary && !isResolved && <span style={{ color: '#c8880c' }}>→</span>}
                            {isMyPrimary && isResolved && !isCorrect && <span style={{ color: '#e05050' }}>✗</span>}
                            {isMySecond  && !isResolved && <span style={{ color: '#8080d0', fontSize: '0.7rem' }}>2ᵉ</span>}
                            {!isCorrect && !isMyPrimary && !isMySecond && (
                              <div className="w-2 h-2 rounded-full mx-auto" style={{ background: '#2a2218' }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate"
                              style={{
                                color: isCorrect ? '#a0ff70' : highlight ? '#f5c842' : isMySecond && !isResolved ? '#a0a0f0' : '#9a8a64',
                                fontFamily: '"Cinzel", serif',
                              }}>
                              {option.label}
                            </p>
                            {option.description && (
                              <p className="text-xs mt-0.5 truncate" style={{ color: '#3a2d10' }}>{option.description}</p>
                            )}
                          </div>
                        </div>
                        {/* Stats votes */}
                        {showVoteStats && option.votePercentage !== undefined && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold" style={{ color: isCorrect ? '#a0ff70' : '#6b5010' }}>
                              {option.votePercentage}%
                            </p>
                            <p className="text-xs" style={{ color: '#3a2d10' }}>
                              {option.voteCount} vote{option.voteCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                      {/* Barre de progression */}
                      {showVoteStats && option.votePercentage !== undefined && (
                        <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: '#0a0906' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${option.votePercentage}%`, background: isCorrect ? 'linear-gradient(to right, #3a8a20, #a0ff70)' : '#3a2d10' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Résultat personnel (après résolution) ── */}
            {isResolved && prediction.myVote && (
              <div className="rounded px-5 py-4 border text-center"
                style={{
                  background: prediction.myVote.isCorrect ? '#1a2810' : '#2a0c0c',
                  border: `1px solid ${prediction.myVote.isCorrect ? '#3a8a2066' : '#6b202066'}`,
                }}>
                <p className="text-3xl mb-2">{prediction.myVote.isCorrect ? '✦' : '✗'}</p>
                <p className="font-bold text-lg"
                  style={{ color: prediction.myVote.isCorrect ? '#a0ff70' : '#e05050', fontFamily: '"Cinzel", serif' }}>
                  {prediction.myVote.isCorrect
                    ? `Prophétie accomplie ! +${prediction.myVote.rewardPoints} pts`
                    : 'Orakl en a décidé autrement…'}
                </p>
                {prediction.totalPointsDistributed !== undefined && (
                  <p className="text-xs mt-1" style={{ color: '#6b5010' }}>
                    {prediction.winnerCount} gagnant{(prediction.winnerCount ?? 0) > 1 ? 's' : ''} · {prediction.totalPointsDistributed} pts distribués
                  </p>
                )}
              </div>
            )}

            {/* ── CTA principal ── */}
            <div className="flex flex-col gap-3 pt-1">
              {/* Voter */}
              {canVote && isAuthenticated && (
                <button
                  onClick={() => navigate(`/p/${shareCode}/vote`)}
                  className="w-full font-bold py-3.5 rounded text-sm transition"
                  style={{ background: 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842', letterSpacing: '0.06em', boxShadow: '0 0 24px #c8880c40' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 32px #c8880c70')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 24px #c8880c40')}>
                  ✦ Émettre ma prophétie
                </button>
              )}

              {/* CTA non authentifié */}
              {canVote && !isAuthenticated && (
                <div className="rounded p-4 text-center space-y-3"
                  style={{ background: '#1e1810', border: '1px solid #c8880c44' }}>
                  <p className="text-sm font-semibold" style={{ fontFamily: '"Cinzel", serif', color: '#f5c842' }}>
                    Rejoins la prophétie
                  </p>
                  <p className="text-xs" style={{ color: '#6b5010' }}>
                    Connecte-toi pour voter et conserver tes points dans les archives.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => navigate('/login')}
                      className="font-semibold px-5 py-2 rounded text-sm transition"
                      style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842' }}>
                      Se connecter
                    </button>
                    <button onClick={() => navigate('/register')}
                      className="px-5 py-2 rounded text-sm transition"
                      style={{ background: '#0e0c08', color: '#c8880c', fontFamily: '"Cinzel", serif', border: '1px solid #3a2d10' }}>
                      S'inscrire
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: '#3a2d10' }}>
                    Tu peux aussi voter en tant qu'invité —{' '}
                    <button onClick={() => navigate(`/p/${shareCode}/vote`)} style={{ color: '#6b5010', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                      continuer sans compte
                    </button>
                  </p>
                </div>
              )}

              {/* Déjà voté → Voir l'attente */}
              {hasVoted && !isResolved && (
                <button
                  onClick={() => navigate(`/p/${shareCode}/waiting`)}
                  className="w-full py-3 rounded text-sm transition"
                  style={{ background: '#161209', border: '1px solid #6b5010', color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.8rem', letterSpacing: '0.04em' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c8880c'; (e.currentTarget as HTMLElement).style.background = '#1e1810' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6b5010'; (e.currentTarget as HTMLElement).style.background = '#161209' }}>
                  ⏳ Voir l'attente &amp; les boosts
                </button>
              )}

              {/* Révéler les résultats (créateur) */}
              {canResolve && (
                <button
                  onClick={() => navigate(`/p/${shareCode}/result`)}
                  className="w-full font-bold py-3 rounded text-sm transition"
                  style={{ background: 'linear-gradient(135deg, #2a6010, #3a8a20)', color: '#d0ffa0', fontFamily: '"Cinzel", serif', border: '1px solid #5aaa30', letterSpacing: '0.06em' }}>
                  ⚖ Révéler la vérité d'Orakl
                </button>
              )}

              {/* Publier (créateur, brouillon) */}
              {isCreator && isDraft && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full font-bold py-3 rounded text-sm transition flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842', opacity: isPublishing ? 0.7 : 1 }}>
                  {isPublishing && (
                    <span className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: '#0e0c08', borderTopColor: 'transparent' }} />
                  )}
                  {isPublishing ? 'Publication…' : '✦ Publier la prophétie'}
                </button>
              )}
            </div>

            {/* ── Section partage (créateur) ── */}
            {isCreator && isOpen && (
              <div className="rounded p-4" style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
                <p className="text-xs font-semibold mb-2" style={{ fontFamily: '"Cinzel", serif', color: '#6b5010' }}>
                  ◈ Inviter des initiés
                </p>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 text-xs px-3 py-2 rounded truncate"
                    style={{ background: '#161209', border: '1px solid #2a2218', color: '#8a7a5a', fontFamily: 'monospace' }}>
                    {window.location.href}
                  </code>
                  <button onClick={copyLink}
                    className="flex-shrink-0 px-3 py-2 rounded text-xs transition"
                    style={{ background: copied ? '#1e1810' : '#161209', border: `1px solid ${copied ? '#f5c842' : '#3a2d10'}`, color: copied ? '#f5c842' : '#6b5010', fontFamily: '"Cinzel", serif' }}>
                    {copied ? '✓' : '◈'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Métadonnées footer ── */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#2a2218', fontFamily: '"Cinzel", serif' }}>
          <span>Votes fermés : {new Date(normalizeDate(prediction.voteDeadline)).toLocaleString('fr-FR')}</span>
          {prediction.revealDate && (
            <span>Révélation : {new Date(normalizeDate(prediction.revealDate)).toLocaleString('fr-FR')}</span>
          )}
          {isResolved && prediction.resolvedAt && (
            <span>Révélé le {new Date(normalizeDate(prediction.resolvedAt)).toLocaleString('fr-FR')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
