import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { useAuth } from '../../context/AuthContext'
import type { Prediction, PredictionOption } from '../../types'

export default function ResultPage() {
  const { shareCode }  = useParams<{ shareCode: string }>()
  const navigate       = useNavigate()
  const { user }       = useAuth()

  const [prediction, setPrediction]           = useState<Prediction | null>(null)
  const [isLoading, setIsLoading]             = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [selectedCorrect, setSelectedCorrect] = useState<PredictionOption | null>(null)
  const [isResolving, setIsResolving]         = useState(false)
  const [resolveError, setResolveError]       = useState<string | null>(null)
  const [copied, setCopied]                   = useState(false)

  useEffect(() => {
    if (!shareCode) return
    predictionService
      .getByShareCode(shareCode)
      .then(p => {
        if (p.status !== 'Resolved' && user?.id !== p.creatorId) {
          navigate(`/p/${shareCode}/waiting`, { replace: true })
          return
        }
        setPrediction(p)
      })
      .catch(() => setError('Pronostic introuvable.'))
      .finally(() => setIsLoading(false))
  }, [shareCode, navigate, user])

  const handleResolve = async () => {
    if (!selectedCorrect || !prediction) return
    setIsResolving(true)
    setResolveError(null)
    try {
      const resolved = await predictionService.resolve(prediction.id, selectedCorrect.id)
      setPrediction(resolved)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Erreur lors de la résolution.'
      setResolveError(msg)
    } finally {
      setIsResolving(false)
    }
  }

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
          <p className="text-white text-xl font-bold mb-4">Pronostic introuvable</p>
          <Link to="/" className="text-violet-400 hover:underline text-sm">Retour</Link>
        </div>
      </div>
    )
  }

  const isCreator     = user?.id === prediction.creatorId
  const isResolved    = prediction.status === 'Resolved'
  const sortedOptions = [...prediction.options].sort((a, b) =>
    (b.votePercentage ?? 0) - (a.votePercentage ?? 0)
  )
  const myVoteOption  = prediction.myVote
    ? prediction.options.find(o => o.id === prediction.myVote!.optionId)
    : null
  const iWon = prediction.myVote?.isCorrect === true

  // Vue créateur : choisir la bonne réponse
  if (isCreator && !isResolved) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-xl mx-auto px-4 py-10">
          <div className="flex items-center gap-4 mb-8">
            <Link to={`/p/${shareCode}/waiting`} className="text-gray-500 hover:text-gray-300 text-sm">
              &larr; Retour
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="text-5xl mb-4">⚡</div>
            <h1 className="text-2xl font-extrabold mb-1">Révèle les résultats</h1>
            <p className="text-gray-400 text-sm">
              Sélectionne la bonne réponse. Les points seront attribués automatiquement.
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-6">
            <p className="text-xs text-gray-500 mb-2">La question</p>
            <p className="text-lg font-bold text-white">{prediction.question}</p>
            {prediction.context && (
              <p className="text-gray-400 text-sm italic mt-1">{prediction.context}</p>
            )}
            <p className="text-xs text-gray-600 mt-3">
              👥 {prediction.participantCount} participant{(prediction.participantCount ?? 0) > 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm font-semibold text-gray-300">Quelle est la bonne réponse ?</p>
            {sortedOptions.map(option => {
              const isSelected = selectedCorrect?.id === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedCorrect(isSelected ? null : option)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all ${
                    isSelected
                      ? 'bg-green-900/30 border-green-600 ring-2 ring-green-500/30 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-green-600/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-green-500 border-green-500' : 'border-gray-600'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="font-semibold text-sm">{option.label}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {resolveError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
              {resolveError}
            </div>
          )}

          <button
            onClick={handleResolve}
            disabled={!selectedCorrect || isResolving}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {isResolving && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isResolving ? 'Révélation...' : selectedCorrect ? `Révéler : "${selectedCorrect.label}"` : 'Sélectionne la bonne réponse'}
          </button>
        </div>
      </div>
    )
  }

  // Vue résultats (tout le monde)
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-6">
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

        {prediction.myVote && (
          <div className={`rounded-2xl border p-6 text-center mb-6 ${
            iWon ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'
          }`}>
            <div className="text-5xl mb-3">{iWon ? '🎉' : '😬'}</div>
            <p className={`text-2xl font-extrabold mb-1 ${iWon ? 'text-green-300' : 'text-red-300'}`}>
              {iWon ? 'Bien joué !' : 'Raté !'}
            </p>
            {iWon && (
              <p className="text-green-400 text-lg font-bold">+{prediction.myVote.rewardPoints} pts</p>
            )}
            {myVoteOption && (
              <p className="text-gray-400 text-sm mt-2">
                Tu avais voté pour : <span className="text-white font-medium">"{myVoteOption.label}"</span>
              </p>
            )}
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Pronostic de <span className="text-violet-400">{prediction.creatorName}</span>
          </p>
          <h1 className="text-xl font-extrabold text-white">{prediction.question}</h1>
          {prediction.context && (
            <p className="text-gray-400 text-sm italic mt-1">{prediction.context}</p>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-5">
          <p className="text-sm font-semibold text-gray-200 mb-4">
            Répartition des votes{' '}
            <span className="text-gray-500 font-normal">
              ({prediction.participantCount} participant{(prediction.participantCount ?? 0) > 1 ? 's' : ''})
            </span>
          </p>
          <div className="space-y-4">
            {sortedOptions.map(option => {
              const isCorrect = option.id === prediction.correctOptionId
              const isMyVote  = prediction.myVote?.optionId === option.id
              const pct       = option.votePercentage ?? 0
              return (
                <div key={option.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isCorrect && <span className="text-green-400 text-sm">✅</span>}
                      {isMyVote && !isCorrect && <span className="text-red-400 text-sm">✗</span>}
                      <span className={`text-sm font-semibold ${
                        isCorrect ? 'text-green-300' : isMyVote ? 'text-gray-400' : 'text-gray-200'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isCorrect ? 'text-green-400' : 'text-gray-500'}`}>
                        {pct}%
                      </span>
                      <span className="text-xs text-gray-600 ml-1">({option.voteCount ?? 0})</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCorrect ? 'bg-green-500' : isMyVote ? 'bg-red-500/50' : 'bg-gray-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
            <p className="text-2xl font-black text-violet-400">{prediction.baseReward}</p>
            <p className="text-xs text-gray-500 mt-1">points distribués</p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
            <p className="text-2xl font-black text-violet-400">
              {prediction.options.find(o => o.id === prediction.correctOptionId)?.voteCount ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">gagnants</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/create"
            className="w-full text-center bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl text-sm transition"
          >
            Créer un nouveau pronostic
          </Link>
          <Link
            to="/"
            className="w-full text-center bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold py-3 rounded-xl text-sm transition"
          >
            Retour à l accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
