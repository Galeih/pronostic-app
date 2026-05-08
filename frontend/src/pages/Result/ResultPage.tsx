import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { useAuth }  from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Navbar from '../../components/layout/Navbar'
import type { Prediction, PredictionOption } from '../../types'
import { usePageTitle } from '../../hooks/usePageTitle'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeDate(d?: string | null): Date | null {
  if (!d) return null
  const s = /[Zz]$|[+\-]\d{2}:\d{2}$/.test(d) ? d : d + 'Z'
  return new Date(s)
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Couleur d'avatar déterministe basée sur le nom
function avatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg, #a36808, #c8880c)',
    'linear-gradient(135deg, #1a4a6b, #3a80c8)',
    'linear-gradient(135deg, #1a6b3a, #3aaa60)',
    'linear-gradient(135deg, #6b1a6b, #c84fc8)',
    'linear-gradient(135deg, #6b1a1a, #c84040)',
    'linear-gradient(135deg, #1a4a4a, #3aaa9a)',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }
const cardStyle = { background: '#161209', border: '1px solid #6b5010', borderRadius: '6px' }

// ─── Page résultat ─────────────────────────────────────────────────────────────

export default function ResultPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { error: toastError, success } = useToast()

  const [prediction, setPrediction]           = useState<Prediction | null>(null)

  usePageTitle(prediction ? `Résultat — ${prediction.question}` : 'Résultat')
  const [voters, setVoters]                   = useState<{ userId: string; userName: string }[]>([])
  const [isLoading, setIsLoading]             = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [selectedCorrect, setSelectedCorrect] = useState<PredictionOption | null>(null)
  const [isResolving, setIsResolving]         = useState(false)
  const [resolveError, setResolveError]       = useState<string | null>(null)
  const [copied, setCopied]                   = useState(false)
  const [showAllVoters, setShowAllVoters]     = useState(false)

  useEffect(() => {
    if (!shareCode) return
    predictionService.getByShareCode(shareCode)
      .then(p => {
        if (p.status !== 'Resolved' && user?.id !== p.creatorId) {
          navigate(`/p/${shareCode}/waiting`, { replace: true }); return
        }
        setPrediction(p)
        // Charger les votants si résolu
        if (p.status === 'Resolved') {
          predictionService.getVoters(p.id)
            .then(v => setVoters(v))
            .catch(() => {/* non bloquant */})
        }
      })
      .catch(() => setError('Pronostic introuvable.'))
      .finally(() => setIsLoading(false))
  }, [shareCode, navigate, user])

  const handleResolve = async () => {
    if (!selectedCorrect || !prediction) return
    setIsResolving(true); setResolveError(null)
    try {
      const resolved = await predictionService.resolve(prediction.id, selectedCorrect.id)
      setPrediction(resolved)
      // Charger les votants après résolution
      predictionService.getVoters(resolved.id)
        .then(v => setVoters(v))
        .catch(() => {/* non bloquant */})
      success(`Verdict rendu : « ${selectedCorrect.label} » est la vérité.`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur lors de la résolution.'
      setResolveError(msg)
      toastError(msg)
    } finally { setIsResolving(false) }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/p/${shareCode}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (error || !prediction) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="text-center">
          <p className="text-4xl mb-4" style={{ color: '#c8880c' }}>✦</p>
          <p className="text-xl font-bold mb-4" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>Pronostic introuvable</p>
          <Link to="/" style={{ color: '#c8880c' }}>Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  )

  const isCreator      = user?.id === prediction.creatorId
  const isResolved     = prediction.status === 'Resolved'
  const sortedOptions  = [...prediction.options].sort((a, b) => (b.votePercentage ?? 0) - (a.votePercentage ?? 0))

  const findOpt = (id?: string | null) =>
    id ? prediction!.options.find(o => o.id.toLowerCase() === id.toLowerCase()) : undefined

  const myVoteOption   = prediction.myVote ? findOpt(prediction.myVote.optionId) : null
  const mySecondOption = prediction.myVote?.secondOptionId ? findOpt(prediction.myVote.secondOptionId) : null
  const iWon           = prediction.myVote?.isCorrect === true

  const gagnants      = prediction.winnerCount
    ?? (prediction.options.find(o => o.id === prediction.correctOptionId)?.voteCount ?? 0)
  const ptsDistribues = prediction.totalPointsDistributed ?? prediction.baseReward

  // Majorité/minorité
  const myChosenOption = myVoteOption
  const myPct          = myChosenOption?.votePercentage ?? 0
  const inMajority     = myPct >= 50

  // Date de résolution
  const resolvedAt = normalizeDate(prediction.resolvedAt)

  // ── Vue créateur : choisir la bonne réponse ────────────────────────────────
  if (isCreator && !isResolved) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center gap-4 mb-8">
          <Link to={`/p/${shareCode}/waiting`} className="text-sm transition"
            style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
            ← Retour
          </Link>
        </div>

        <div className="text-center mb-8">
          <p className="text-5xl mb-4" style={{ color: '#f5c842' }}>⚖</p>
          <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
            Orakl te juge
          </h1>
          <p className="text-sm" style={{ color: '#6b5010' }}>
            Transmets le verdict d'Orakl. Ses serviteurs recevront leurs points.
          </p>
        </div>

        <div className="relative p-5 rounded mb-6" style={cardStyle}>
          <span style={{ position:'absolute', top:6, left:6, color:'#c8880c', fontSize:'8px' }}>◆</span>
          <span style={{ position:'absolute', top:6, right:6, color:'#c8880c', fontSize:'8px' }}>◆</span>
          <p className="text-xs mb-2" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>La prophétie</p>
          <p className="text-lg font-bold" style={{ color: '#f0dfa8', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            « {prediction.question} »
          </p>
          {prediction.context && <p className="text-sm italic mt-1" style={{ color: '#6b5010' }}>{prediction.context}</p>}
          <div className="flex items-center gap-4 mt-3">
            <p className="text-xs" style={{ color: '#3a2d10' }}>
              👥 <span style={{ color: '#8a7a5a' }}>{prediction.participantCount}</span> initiés
            </p>
            <p className="text-xs" style={{ color: '#3a2d10' }}>
              ✦ <span style={{ color: '#8a7a5a' }}>{prediction.baseReward} pts</span> en jeu
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-semibold" style={{ fontFamily: '"Cinzel", serif', color: '#8a7a5a' }}>
            Quelle est la vérité ?
          </p>
          {sortedOptions.map(option => {
            const isSel = selectedCorrect?.id === option.id
            const pct   = option.votePercentage ?? 0
            return (
              <button
                key={option.id}
                onClick={() => setSelectedCorrect(isSel ? null : option)}
                className="w-full text-left rounded px-4 py-3.5 transition-all"
                style={{
                  background: isSel ? '#1a2810' : '#0e0c08',
                  border: `1px solid ${isSel ? '#3a8a20' : '#3a2d10'}`,
                  boxShadow: isSel ? '0 0 16px #3a8a2030' : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: isSel ? '#5aaa30' : '#3a2d10', background: isSel ? '#5aaa30' : 'transparent' }}>
                      {isSel && <div className="w-2 h-2 rounded-full" style={{ background: '#0e0c08' }} />}
                    </div>
                    <span className="font-semibold text-sm" style={{ color: isSel ? '#a0ff70' : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                      {option.label}
                    </span>
                  </div>
                  {pct > 0 && (
                    <span className="text-xs flex-shrink-0" style={{ color: '#3a2d10' }}>{pct}%</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {resolveError && (
          <div className="rounded px-4 py-3 text-sm mb-4" style={{ background: '#2a0c0c', border: '1px solid #6b2020', color: '#e05050' }}>
            {resolveError}
          </div>
        )}

        <button
          onClick={handleResolve}
          disabled={!selectedCorrect || isResolving}
          className="w-full font-bold py-3.5 rounded text-sm transition flex items-center justify-center gap-2"
          style={{
            background: selectedCorrect ? 'linear-gradient(135deg, #2a6010, #3a8a20)' : '#2a2218',
            color: selectedCorrect ? '#d0ffa0' : '#3a2d10',
            fontFamily: '"Cinzel", serif', fontSize: '0.8rem',
            border: `1px solid ${selectedCorrect ? '#5aaa30' : '#2a2218'}`,
            cursor: selectedCorrect && !isResolving ? 'pointer' : 'not-allowed',
            letterSpacing: '0.06em',
          }}
        >
          {isResolving && <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#0e0c08', borderTopColor: 'transparent' }} />}
          {isResolving ? 'Orakl délibère...' : selectedCorrect ? `⚖ Révéler : « ${selectedCorrect.label} »` : 'Révèle la volonté d\'Orakl'}
        </button>
      </div>
    </div>
  )

  // ── Vue résultats ──────────────────────────────────────────────────────────

  const visibleVoters = showAllVoters ? voters : voters.slice(0, 12)

  return (
    <div style={pageStyle}>
      <Navbar />

      {/* Animation CSS pour le ✦ gagnant */}
      <style>{`
        @keyframes orakl-pulse {
          0%, 100% { transform: scale(1);   opacity: 1;    text-shadow: 0 0 12px #a0ff7080; }
          50%       { transform: scale(1.2); opacity: 0.85; text-shadow: 0 0 28px #a0ff70cc; }
        }
        .win-pulse { animation: orakl-pulse 2.4s ease-in-out infinite; display: inline-block; }
      `}</style>

      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Barre du haut */}
        <div className="flex items-center justify-between mb-6">
          <Link to={`/p/${shareCode}`} className="text-sm transition"
            style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
            ← Pronostic
          </Link>
          <button onClick={copyLink} className="text-sm px-4 py-2 rounded transition"
            style={{ background: '#161209', border: '1px solid #6b5010', color: copied ? '#f5c842' : '#8a7a5a', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}>
            {copied ? '✓ Copié !' : '◈ Partager'}
          </button>
        </div>

        {/* Bannière victoire / défaite */}
        {prediction.myVote && (
          <div className="rounded p-6 text-center mb-6" style={{
            background: iWon ? '#1a2810' : '#2a0c0c',
            border: `1px solid ${iWon ? '#3a8a20' : '#6b2020'}`,
            boxShadow: `0 0 30px ${iWon ? '#3a8a2030' : '#6b202030'}`,
          }}>
            <div className="text-5xl mb-3">
              {iWon
                ? <span className="win-pulse">✦</span>
                : <span style={{ color: '#e05050' }}>✗</span>
              }
            </div>
            <p className="text-2xl font-extrabold mb-1"
              style={{ fontFamily: '"Cinzel Decorative", serif', color: iWon ? '#a0ff70' : '#e05050' }}>
              {iWon ? 'Prophétie accomplie !' : 'Orakl en a décidé autrement'}
            </p>
            {iWon && (
              <p className="font-bold text-lg" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                +{prediction.myVote.rewardPoints} pts
              </p>
            )}

            {/* Choix de l'utilisateur */}
            <div className="mt-3 space-y-1">
              {myVoteOption && (
                <p className="text-sm" style={{ color: '#6b5010' }}>
                  {mySecondOption ? 'Vote principal' : 'Tu avais choisi'} :{' '}
                  <span style={{ color: '#f0dfa8', fontFamily: '"Cinzel", serif' }}>« {myVoteOption.label} »</span>
                </p>
              )}
              {mySecondOption && (
                <p className="text-sm" style={{ color: '#6b5010' }}>
                  Second vote :{' '}
                  <span style={{ color: '#a0a0f0', fontFamily: '"Cinzel", serif' }}>« {mySecondOption.label} »</span>
                  {mySecondOption.id.toLowerCase() === prediction.correctOptionId?.toLowerCase() && (
                    <span className="ml-1.5" style={{ color: '#a0ff70' }}>✦</span>
                  )}
                </p>
              )}
            </div>

            {/* Majorité / Minorité */}
            {myChosenOption && myPct > 0 && (
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid #2a2218' }}>
                <p className="text-xs" style={{ color: inMajority ? '#8a7a5a' : '#5a4a6a' }}>
                  {inMajority
                    ? `✦ Tu étais dans la majorité (${myPct}% avaient choisi « ${myChosenOption.label} »)`
                    : `◇ Tu étais dans la minorité (${myPct}% avaient choisi « ${myChosenOption.label} »)`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Carte question */}
        <div className="relative p-5 rounded mb-5" style={cardStyle}>
          <span style={{ position:'absolute', top:6, left:6, color:'#c8880c', fontSize:'8px' }}>◆</span>
          <span style={{ position:'absolute', top:6, right:6, color:'#c8880c', fontSize:'8px' }}>◆</span>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
            Prophétie de <span style={{ color: '#c8880c' }}>{prediction.creatorName}</span>
          </p>
          <h1 className="text-xl font-extrabold" style={{ color: '#f0dfa8', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            « {prediction.question} »
          </h1>
          {prediction.context && <p className="text-sm italic mt-1" style={{ color: '#6b5010' }}>{prediction.context}</p>}
        </div>

        {/* Répartition des votes */}
        <div className="relative p-5 rounded mb-5" style={cardStyle}>
          <p className="text-sm font-semibold mb-4" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>
            Répartition des votes{' '}
            <span style={{ color: '#6b5010', fontWeight: 400 }}>({prediction.participantCount} initiés)</span>
          </p>
          <div className="space-y-4">
            {sortedOptions.map(option => {
              const lid           = option.id.toLowerCase()
              const isCorrect     = lid === prediction.correctOptionId?.toLowerCase()
              const isMyPrimary   = lid === prediction.myVote?.optionId?.toLowerCase()
              const isMySecondary = lid === prediction.myVote?.secondOptionId?.toLowerCase()
              const pct           = option.votePercentage ?? 0
              return (
                <div key={option.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {isCorrect && <span style={{ color: '#a0ff70' }}>✦</span>}
                      {isMyPrimary && !isCorrect && <span style={{ color: '#e05050' }}>✗</span>}
                      <span className="text-sm font-semibold truncate" style={{
                        color: isCorrect ? '#a0ff70' : isMyPrimary ? '#8a6060' : '#9a8a64',
                        fontFamily: '"Cinzel", serif',
                      }}>
                        {option.label}
                      </span>
                      {isMySecondary && !isMyPrimary && (
                        <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded" style={{
                          background: '#1a1a2e', border: '1px solid #4a4a8a', color: '#a0a0f0',
                        }}>2ᵉ</span>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right ml-2">
                      <span className="text-sm font-bold" style={{ color: isCorrect ? '#a0ff70' : '#6b5010' }}>{pct}%</span>
                      <span className="text-xs ml-1" style={{ color: '#3a2d10' }}>({option.voteCount ?? 0})</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#0e0c08' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: isCorrect ? 'linear-gradient(to right, #3a8a20, #a0ff70)' : isMyPrimary ? '#4a2020' : '#3a2d10' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats : pts distribués + gagnants */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: 'pts distribués', val: ptsDistribues },
            { label: 'gagnants',       val: gagnants },
          ].map(s => (
            <div key={s.label} className="rounded p-4 text-center" style={cardStyle}>
              <p className="text-2xl font-black" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>{s.val}</p>
              <p className="text-xs mt-1" style={{ color: '#6b5010' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Section votants */}
        {voters.length > 0 && (
          <div className="relative p-5 rounded mb-5" style={cardStyle}>
            <p className="text-sm font-semibold mb-4" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>
              Initiés ayant participé{' '}
              <span style={{ color: '#6b5010', fontWeight: 400 }}>({voters.length})</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleVoters.map(v => (
                <div
                  key={v.userId}
                  title={v.userName}
                  className="flex items-center justify-center rounded-full flex-shrink-0 text-xs font-bold"
                  style={{
                    width: 36, height: 36,
                    background: avatarColor(v.userName),
                    color: '#0e0c08',
                    fontFamily: '"Cinzel", serif',
                    fontSize: '0.65rem',
                    letterSpacing: '0.04em',
                    boxShadow: '0 0 0 2px #0e0c08',
                  }}
                >
                  {initials(v.userName)}
                </div>
              ))}
            </div>
            {voters.length > 12 && (
              <button
                onClick={() => setShowAllVoters(v => !v)}
                className="text-xs mt-3 transition"
                style={{ color: '#6b5010', fontFamily: '"Cinzel", serif', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}
              >
                {showAllVoters ? '↑ Réduire' : `Voir les ${voters.length - 12} autres…`}
              </button>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link to="/create"
            className="w-full text-center font-bold py-3.5 rounded transition"
            style={{
              background: 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
              color: '#0e0c08',
              fontFamily: '"Cinzel", serif',
              fontSize: '0.8rem',
              border: '1px solid #f5c842',
              letterSpacing: '0.06em',
              boxShadow: '0 0 20px #c8880c30',
            }}>
            ✦ Invoquer à nouveau
          </Link>
          <Link to="/history"
            className="w-full text-center font-semibold py-3 rounded transition"
            style={{
              background: '#161209',
              border: '1px solid #6b5010',
              color: '#8a7a5a',
              fontFamily: '"Cinzel", serif',
              fontSize: '0.75rem',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c8880c'; (e.currentTarget as HTMLElement).style.color = '#c8880c' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6b5010'; (e.currentTarget as HTMLElement).style.color = '#8a7a5a' }}
          >
            ◈ Mes archives
          </Link>
          <Link to="/"
            className="w-full text-center font-semibold py-3 rounded transition"
            style={{ background: 'transparent', border: 'none', color: '#3a2d10', fontFamily: '"Cinzel", serif', fontSize: '0.7rem' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#6b5010')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#3a2d10')}
          >
            Retour à l'accueil
          </Link>
        </div>

        {/* Footer : date de résolution */}
        {resolvedAt && (
          <p className="text-center text-xs mt-8" style={{ color: '#2a2218', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            Verdict rendu le {formatDate(resolvedAt)}
          </p>
        )}

      </div>
    </div>
  )
}
