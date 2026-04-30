import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { useAuth } from '../../context/AuthContext'
import type { Prediction, PredictionOption } from '../../types'

function useCountdown(deadline: string) {
  const calc = () => Math.max(0, new Date(deadline).getTime() - Date.now())
  const [ms, setMs] = useState(calc)

  useEffect(() => {
    const id = setInterval(() => setMs(calc()), 1000)
    return () => clearInterval(id)
  })

  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const expired = ms === 0

  return {
    expired,
    label: h > 0
      ? `${h}h ${m.toString().padStart(2, '0')}m`
      : m > 0
        ? `${m}m ${sec.toString().padStart(2, '0')}s`
        : `${sec}s`,
    urgent: s < 60,
  }
}

export default function VotePage() {
  const { shareCode }              = useParams<{ shareCode: string }>()
  const navigate                   = useNavigate()
  const { isAuthenticated }        = useAuth()

  const [prediction, setPrediction]     = useState<Prediction | null>(null)
  const [selected, setSelected]         = useState<PredictionOption | null>(null)
  const [isLoading, setIsLoading]       = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voted, setVoted]               = useState(false)
  const [votedLabel, setVotedLabel]     = useState('')
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    if (!shareCode) return
    predictionService
      .getByShareCode(shareCode)
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

  useEffect(() => {
    if (countdown.expired && prediction) {
      navigate(`/p/${shareCode}/waiting`, { replace: true })
    }
  }, [countdown.expired, prediction, shareCode, navigate])

  const handleVote = async () => {
    if (!selected || !prediction) return
    if (!isAuthenticated) { navigate('/login'); return }
    setIsSubmitting(true)
    setError(null)
    try {
      await predictionService.vote(prediction.id, selected.id)
      setVotedLabel(selected.label)
      setVoted(true)
      setTimeout(() => navigate(`/p/${shareCode}/waiting`), 2000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Une erreur est survenue.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !prediction) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">404</p>
          <p className="text-white text-xl font-bold mb-2">Pronostic introuvable</p>
          <Link to="/" className="text-violet-400 hover:underline text-sm">Retour</Link>
        </div>
      </div>
    )
  }

  if (voted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-5 animate-bounce">🗳️</div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Vote enregistré !</h1>
          <p className="text-gray-400 mb-1">Tu as voté pour</p>
          <p className="text-violet-300 font-bold text-lg">"{votedLabel}"</p>
          <p className="text-gray-600 text-sm mt-4">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  if (!prediction) return null

  const sortedOptions = [...prediction.options].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-6">
          <Link to={`/p/${shareCode}`} className="text-gray-500 hover:text-gray-300 text-sm">
            &larr; Retour
          </Link>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-colors ${
            countdown.urgent
              ? 'bg-red-900/30 border-red-700 text-red-400 animate-pulse'
              : 'bg-gray-800 border-gray-700 text-gray-300'
          }`}>
            ⏱ {countdown.label}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl p-6">
          <p className="text-xs text-gray-500 mb-3">
            Pronostic de <span className="text-violet-400 font-medium">{prediction.creatorName}</span>
          </p>
          <h1 className="text-2xl font-extrabold text-white leading-snug mb-2">
            {prediction.question}
          </h1>
          {prediction.context && (
            <p className="text-gray-400 text-sm italic mb-5">{prediction.context}</p>
          )}

          <div className="border-t border-gray-800 pt-5">
            <p className="text-sm font-semibold text-gray-300 mb-3">Choisis ta réponse</p>
            <div className="space-y-3">
              {sortedOptions.map(option => {
                const isSelected = selected?.id === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelected(isSelected ? null : option)}
                    className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-150 ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 ring-2 ring-violet-500/40 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-violet-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-violet-500 border-violet-500' : 'border-gray-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{option.label}</p>
                        {option.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6">
            {!isAuthenticated && (
              <p className="text-xs text-gray-500 text-center mb-3">
                <Link to="/login" className="text-violet-400 hover:underline">Connecte-toi</Link>
                {' '}pour voter et conserver tes points.
              </p>
            )}
            <button
              onClick={handleVote}
              disabled={!selected || isSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isSubmitting ? 'Enregistrement...' : selected ? `Voter pour "${selected.label}"` : 'Sélectionne un choix'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
          <span>👥 {prediction.participantCount} participant{(prediction.participantCount ?? 0) > 1 ? 's' : ''}</span>
          <span>🏆 {prediction.baseReward} pts en jeu</span>
        </div>
      </div>
    </div>
  )
}
