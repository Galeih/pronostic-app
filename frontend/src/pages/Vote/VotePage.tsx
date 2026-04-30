import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { useAuth } from '../../context/AuthContext'
import type { Prediction, PredictionOption } from '../../types'

function useCountdown(deadline: string) {
  const calc = () => Math.max(0, new Date(deadline).getTime() - Date.now())
  const [ms, setMs] = useState(calc)
  useEffect(() => { const id = setInterval(() => setMs(calc()), 1000); return () => clearInterval(id) })
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return {
    expired: ms === 0,
    label: h > 0 ? `${h}h ${String(m).padStart(2,'0')}m` : m > 0 ? `${m}m ${String(sec).padStart(2,'0')}s` : `${sec}s`,
    urgent: s < 60,
  }
}

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }

export default function VotePage() {
  const { shareCode }       = useParams<{ shareCode: string }>()
  const navigate            = useNavigate()
  const { isAuthenticated } = useAuth()
  const [prediction, setPrediction]     = useState<Prediction | null>(null)
  const [selected, setSelected]         = useState<PredictionOption | null>(null)
  const [isLoading, setIsLoading]       = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voted, setVoted]               = useState(false)
  const [votedLabel, setVotedLabel]     = useState('')
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    if (!shareCode) return
    predictionService.getByShareCode(shareCode)
      .then(p => {
        if (p.myVote)            return navigate(`/p/${shareCode}/waiting`, { replace: true })
        if (p.status !== 'Open') return navigate(`/p/${shareCode}`, { replace: true })
        setPrediction(p)
      })
      .catch(() => setError('Pronostic introuvable.'))
      .finally(() => setIsLoading(false))
  }, [shareCode, navigate])

  const deadline  = prediction?.voteDeadline ?? new Date(Date.now() + 99999999).toISOString()
  const countdown = useCountdown(deadline)
  useEffect(() => { if (countdown.expired && prediction) navigate(`/p/${shareCode}/waiting`, { replace: true }) }, [countdown.expired])

  const handleVote = async () => {
    if (!selected || !prediction) return
    if (!isAuthenticated) { navigate('/login'); return }
    setIsSubmitting(true); setError(null)
    try {
      await predictionService.vote(prediction.id, selected.id)
      setVotedLabel(selected.label); setVoted(true)
      setTimeout(() => navigate(`/p/${shareCode}/waiting`), 2000)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur.')
    } finally { setIsSubmitting(false) }
  }

  if (isLoading) return (
    <div style={pageStyle} className="flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
    </div>
  )

  if (voted) return (
    <div style={pageStyle} className="flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-5">✦</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
          Prophétie scellée !
        </h1>
        <p className="text-sm mb-1" style={{ color: '#6b5010' }}>Tu as choisi</p>
        <p className="font-bold text-lg" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif' }}>« {votedLabel} »</p>
        <p className="text-xs mt-4" style={{ color: '#3a2d10' }}>Redirection en cours...</p>
      </div>
    </div>
  )

  if (!prediction) return (
    <div style={pageStyle} className="flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-4" style={{ color: '#c8880c' }}>✦</p>
        <p className="text-xl font-bold mb-2" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>Pronostic introuvable</p>
        <Link to="/" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.8rem' }}>Retour</Link>
      </div>
    </div>
  )

  const sortedOptions = [...prediction.options].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div style={pageStyle}>
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-6">
          <Link to={`/p/${shareCode}`} className="text-sm transition" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
            ← Retour
          </Link>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold"
            style={{
              background: countdown.urgent ? '#2a0c0c' : '#161209',
              border: `1px solid ${countdown.urgent ? '#6b2020' : '#6b5010'}`,
              color: countdown.urgent ? '#e05050' : '#c8880c',
              fontFamily: '"Cinzel", serif',
              animation: countdown.urgent ? 'pulse 1s infinite' : 'none',
            }}
          >
            ⏳ {countdown.label}
          </div>
        </div>

        <div className="relative p-6 rounded shadow-2xl" style={{ background: '#161209', border: '1px solid #6b5010' }}>
          <span style={{ position:'absolute', top:8, left:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', top:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, left:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>

          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
              Prophétie de <span style={{ color: '#c8880c' }}>{prediction.creatorName}</span>
            </p>
            {prediction.isAnonymous && (
              <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: '#1a1208', border: '1px solid #c8880c', color: '#f5c842', fontFamily: '"Cinzel", serif', letterSpacing: '0.06em' }}>
                ◉ Prophétie Aveugle
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold leading-snug mb-2" style={{ fontFamily: '"Lora", serif', color: '#f0dfa8' }}>
            « {prediction.question} »
          </h1>
          {prediction.isAnonymous && (
            <p className="text-xs mb-3 italic" style={{ color: '#6b5010' }}>
              Orakl garde le secret des votes jusqu'à la révélation.
            </p>
          )}
          {prediction.context && (
            <p className="text-sm italic mb-5" style={{ color: '#6b5010' }}>{prediction.context}</p>
          )}

          <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', margin:'20px 0' }} />

          <p className="text-sm font-semibold mb-3" style={{ fontFamily: '"Cinzel", serif', color: '#8a7a5a' }}>
            Soumets-toi au jugement d'Orakl
          </p>
          <div className="space-y-3">
            {sortedOptions.map(option => {
              const isSel = selected?.id === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setSelected(isSel ? null : option)}
                  className="w-full text-left rounded px-4 py-3.5 transition-all"
                  style={{
                    background: isSel ? '#1e1810' : '#0e0c08',
                    border: `1px solid ${isSel ? '#c8880c' : '#3a2d10'}`,
                    boxShadow: isSel ? '0 0 16px #c8880c30' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                      style={{ borderColor: isSel ? '#c8880c' : '#3a2d10', background: isSel ? '#c8880c' : 'transparent' }}
                    >
                      {isSel && <div className="w-2 h-2 rounded-full" style={{ background: '#0e0c08' }} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: isSel ? '#f5c842' : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="text-xs mt-0.5" style={{ color: '#6b5010' }}>{option.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {error && (
            <div className="mt-4 rounded px-4 py-3 text-sm" style={{ background: '#2a0c0c', border: '1px solid #6b2020', color: '#e05050' }}>
              {error}
            </div>
          )}

          <div className="mt-6">
            {!isAuthenticated && (
              <p className="text-xs text-center mb-3" style={{ color: '#6b5010' }}>
                <Link to="/login" style={{ color: '#c8880c' }}>Connecte-toi</Link> pour voter et conserver tes points.
              </p>
            )}
            <button
              onClick={handleVote}
              disabled={!selected || isSubmitting}
              className="w-full font-bold py-3.5 rounded text-sm transition flex items-center justify-center gap-2"
              style={{
                background: selected && !isSubmitting ? 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)' : '#2a2218',
                color: selected && !isSubmitting ? '#0e0c08' : '#3a2d10',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.8rem',
                border: `1px solid ${selected ? '#f5c842' : '#2a2218'}`,
                cursor: selected && !isSubmitting ? 'pointer' : 'not-allowed',
                letterSpacing: '0.06em',
                boxShadow: selected ? '0 0 20px #c8880c40' : 'none',
              }}
            >
              {isSubmitting && <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#0e0c08', borderTopColor: 'transparent' }} />}
              {isSubmitting ? 'Orakl enregistre ton choix...' : selected ? `✦ Voter pour « ${selected.label} »` : 'Soumets-toi au jugement'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs" style={{ color: '#3a2d10' }}>
          <span>👥 {prediction.participantCount} participants</span>
          <span>⚖ {prediction.baseReward} pts en jeu</span>
        </div>
      </div>
    </div>
  )
}
