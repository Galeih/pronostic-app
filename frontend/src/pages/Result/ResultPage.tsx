import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { useAuth }  from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { Prediction, PredictionOption } from '../../types'

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }
const cardStyle = { background: '#161209', border: '1px solid #6b5010', borderRadius: '6px' }

export default function ResultPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { error: toastError, success } = useToast()

  const [prediction, setPrediction]           = useState<Prediction | null>(null)
  const [isLoading, setIsLoading]             = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [selectedCorrect, setSelectedCorrect] = useState<PredictionOption | null>(null)
  const [isResolving, setIsResolving]         = useState(false)
  const [resolveError, setResolveError]       = useState<string | null>(null)
  const [copied, setCopied]                   = useState(false)

  useEffect(() => {
    if (!shareCode) return
    predictionService.getByShareCode(shareCode)
      .then(p => {
        if (p.status !== 'Resolved' && user?.id !== p.creatorId) {
          navigate(`/p/${shareCode}/waiting`, { replace: true }); return
        }
        setPrediction(p)
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

  if (isLoading) return (
    <div style={pageStyle} className="flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
    </div>
  )

  if (error || !prediction) return (
    <div style={pageStyle} className="flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-4" style={{ color: '#c8880c' }}>✦</p>
        <p className="text-xl font-bold mb-4" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>Pronostic introuvable</p>
        <Link to="/" style={{ color: '#c8880c' }}>Retour</Link>
      </div>
    </div>
  )

  const isCreator      = user?.id === prediction.creatorId
  const isResolved     = prediction.status === 'Resolved'
  const sortedOptions  = [...prediction.options].sort((a, b) => (b.votePercentage ?? 0) - (a.votePercentage ?? 0))

  // Comparaison GUID insensible à la casse
  const findOpt = (id?: string | null) =>
    id ? prediction!.options.find(o => o.id.toLowerCase() === id.toLowerCase()) : undefined

  const myVoteOption   = prediction.myVote ? findOpt(prediction.myVote.optionId) : null
  const mySecondOption = prediction.myVote?.secondOptionId ? findOpt(prediction.myVote.secondOptionId) : null
  const iWon           = prediction.myVote?.isCorrect === true

  // Stats réelles après résolution
  const gagnants         = prediction.winnerCount
    ?? (prediction.options.find(o => o.id === prediction.correctOptionId)?.voteCount ?? 0)
  const ptsDistribues    = prediction.totalPointsDistributed ?? prediction.baseReward

  // ── Vue créateur: choisir la bonne réponse ───────────────────
  if (isCreator && !isResolved) return (
    <div style={pageStyle}>
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
          <p className="text-xs mt-3" style={{ color: '#3a2d10' }}>👥 {prediction.participantCount} initiés</p>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-semibold" style={{ fontFamily: '"Cinzel", serif', color: '#8a7a5a' }}>
            Quelle est la vérité ?
          </p>
          {sortedOptions.map(option => {
            const isSel = selectedCorrect?.id === option.id
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
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: isSel ? '#5aaa30' : '#3a2d10', background: isSel ? '#5aaa30' : 'transparent' }}>
                    {isSel && <div className="w-2 h-2 rounded-full" style={{ background: '#0e0c08' }} />}
                  </div>
                  <span className="font-semibold text-sm" style={{ color: isSel ? '#a0ff70' : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                    {option.label}
                  </span>
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

  // ── Vue résultats ─────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div className="max-w-xl mx-auto px-4 py-10">

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

        {prediction.myVote && (
          <div className="rounded p-6 text-center mb-6" style={{
            background: iWon ? '#1a2810' : '#2a0c0c',
            border: `1px solid ${iWon ? '#3a8a20' : '#6b2020'}`,
            boxShadow: `0 0 30px ${iWon ? '#3a8a2030' : '#6b202030'}`,
          }}>
            <div className="text-5xl mb-3">{iWon ? '✦' : '✗'}</div>
            <p className="text-2xl font-extrabold mb-1" style={{ fontFamily: '"Cinzel Decorative", serif', color: iWon ? '#a0ff70' : '#e05050' }}>
              {iWon ? 'Prophétie accomplie !' : 'Orakl en a décidé autrement'}
            </p>
            {iWon && <p className="font-bold text-lg" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>+{prediction.myVote.rewardPoints} pts</p>}

            {/* Vote(s) de l'utilisateur */}
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
          </div>
        )}

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
                      {/* Badge second vote */}
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

        <div className="grid grid-cols-2 gap-3 mb-6">
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

        <div className="flex flex-col gap-3">
          <Link to="/create" className="w-full text-center font-bold py-3.5 rounded transition"
            style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', fontSize: '0.8rem', border: '1px solid #f5c842', letterSpacing: '0.06em' }}>
            ✦ Invoquer à nouveau
          </Link>
          <Link to="/" className="w-full text-center font-semibold py-3 rounded transition"
            style={{ background: '#161209', border: '1px solid #3a2d10', color: '#6b5010', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
