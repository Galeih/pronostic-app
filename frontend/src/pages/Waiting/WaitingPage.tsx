import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { useAuth } from '../../context/AuthContext'
import type { Prediction } from '../../types'

function useCountdown(targetDate: string | undefined) {
  const calc = () =>
    targetDate ? Math.max(0, new Date(targetDate).getTime() - Date.now()) : null
  const [ms, setMs] = useState<number | null>(calc)
  useEffect(() => {
    const id = setInterval(() => setMs(calc()), 1000)
    return () => clearInterval(id)
  })
  if (ms === null) return { label: null, expired: false }
  if (ms === 0)    return { label: null, expired: true }
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const label = h > 0
    ? `${h}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`
    : m > 0 ? `${m}m ${sec.toString().padStart(2, '0')}s` : `${sec}s`
  return { label, expired: false }
}

export default function WaitingPage() {
  const { shareCode }       = useParams<{ shareCode: string }>()
  const navigate            = useNavigate()
  const { user }            = useAuth()
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)
  const revealCountdown = useCountdown(prediction?.revealDate)

  const load = useCallback(async () => {
    if (!shareCode) return
    try {
      const p = await predictionService.getByShareCode(shareCode)
      if (p.status === 'Resolved') {
        navigate(`/p/${shareCode}/result`, { replace: true })
        return
      }
      if (p.status === 'Open' && !p.myVote) {
        navigate(`/p/${shareCode}/vote`, { replace: true })
        return
      }
      setPrediction(p)
    } catch {
      setError('Pronostic introuvable.')
    } finally {
      setIsLoading(false)
    }
  }, [shareCode, navigate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const id = setInterval(async () => {
      if (!shareCode) return
      try {
        const p = await predictionService.getByShareCode(shareCode)
        if (p.status === 'Resolved') {
          navigate(`/p/${shareCode}/result`, { replace: true })
        } else {
          setPrediction(p)
        }
      } catch { /* silencieux */ }
    }, 15_000)
    return () => clearInterval(id)
  }, [shareCode, navigate])

  useEffect(() => {
    if (revealCountdown.expired && prediction?.status === 'Resolved') {
      navigate(`/p/${shareCode}/result`, { replace: true })
    }
  }, [revealCountdown.expired, prediction, shareCode, navigate])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/p/${shareCode}`)
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
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white text-xl font-bold mb-4">{error ?? 'Pronostic introuvable.'}</p>
          <Link to="/" className="text-violet-400 hover:underline text-sm">Retour</Link>
        </div>
      </div>
    )
  }

  const myVoteOption = prediction.myVote
    ? prediction.options.find(o => o.id === prediction.myVote!.optionId)
    : null
  const isCreator   = user?.id === prediction.creatorId
  const votesOpen   = prediction.status === 'Open'
  const votesClosed = prediction.status === 'VoteClosed' || prediction.status === 'AwaitingResolution'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="max-w-xl mx-auto px-4 py-10 flex-1 w-full">

        <div className="flex items-center justify-between mb-8">
          <Link to={`/p/${shareCode}`} className="text-gray-500 hover:text-gray-300 text-sm">
            &larr; Pronostic
          </Link>
          <button
            onClick={copyLink}
            className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg transition"
          >
            {copied ? 'Copié !' : 'Partager'}
          </button>
        </div>

        <div className="text-center mb-10">
          {votesOpen && (
            <>
              <div className="text-6xl mb-4">⏳</div>
              <h1 className="text-2xl font-extrabold mb-2">Votes en cours</h1>
              <p className="text-gray-400 text-sm">D autres peuvent encore voter.</p>
            </>
          )}
          {votesClosed && (
            <>
              <div className="text-6xl mb-4 animate-pulse">🔮</div>
              <h1 className="text-2xl font-extrabold mb-2">Votes fermés !</h1>
              {revealCountdown.label ? (
                <>
                  <p className="text-gray-400 text-sm mb-3">Révélation dans</p>
                  <div className="inline-block bg-violet-900/30 border border-violet-700 rounded-2xl px-8 py-4">
                    <p className="text-4xl font-mono font-black text-violet-300 tracking-widest">
                      {revealCountdown.label}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">En attente de la résolution...</p>
              )}
            </>
          )}
        </div>

        {myVoteOption && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Ton pronostic</p>
            <p className="text-lg font-bold text-white mb-1">{prediction.question}</p>
            <div className="mt-3 bg-violet-900/20 border border-violet-700/40 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-violet-500 flex-shrink-0" />
              <p className="text-violet-200 font-semibold">{myVoteOption.label}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-5">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-black text-violet-400">{prediction.participantCount}</p>
              <p className="text-xs text-gray-500 mt-1">participants</p>
            </div>
            <div>
              <p className="text-3xl font-black text-violet-400">{prediction.baseReward}</p>
              <p className="text-xs text-gray-500 mt-1">points en jeu</p>
            </div>
          </div>
        </div>

        {isCreator && votesClosed && (
          <div className="bg-orange-900/20 border border-orange-700/40 rounded-2xl p-5 text-center">
            <p className="text-orange-300 font-semibold mb-1">C est toi le créateur !</p>
            <p className="text-gray-400 text-sm mb-4">Révèle maintenant les résultats.</p>
            <button
              onClick={() => navigate(`/p/${shareCode}/result`)}
              className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
            >
              Révéler les résultats
            </button>
          </div>
        )}

        {votesOpen && !myVoteOption && (
          <div className="text-center">
            <button
              onClick={() => navigate(`/p/${shareCode}/vote`)}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3 rounded-xl text-sm transition"
            >
              Voter maintenant
            </button>
          </div>
        )}

        {votesClosed && !isCreator && (
          <p className="text-center text-xs text-gray-600 mt-4">
            La page se met à jour automatiquement toutes les 15 secondes.
          </p>
        )}
      </div>
    </div>
  )
}
