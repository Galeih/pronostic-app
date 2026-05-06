import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { boostService }      from '../../services/boostService'
import { useAuth } from '../../context/AuthContext'
import type { Prediction, BoostCatalogItem } from '../../types'
import BoostPanel from './BoostPanel'

function useCountdown(targetDate: string | undefined) {
  const calc = () => targetDate ? Math.max(0, new Date(targetDate).getTime() - Date.now()) : null
  const [ms, setMs] = useState<number | null>(calc)
  useEffect(() => { const id = setInterval(() => setMs(calc()), 1000); return () => clearInterval(id) })
  if (ms === null) return { label: null, expired: false }
  if (ms === 0)    return { label: null, expired: true }
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  const label = h > 0 ? `${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`
    : m > 0 ? `${m}m ${String(sec).padStart(2,'0')}s` : `${sec}s`
  return { label, expired: false }
}

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }

export default function WaitingPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [catalog, setCatalog]       = useState<BoostCatalogItem[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)
  const revealCountdown = useCountdown(prediction?.revealDate)

  const load = useCallback(async () => {
    if (!shareCode) return
    try {
      const p = await predictionService.getByShareCode(shareCode)
      if (p.status === 'Resolved') { navigate(`/p/${shareCode}/result`, { replace: true }); return }
      if (p.status === 'Open' && !p.myVote) { navigate(`/p/${shareCode}/vote`, { replace: true }); return }
      setPrediction(p)

      // Charger le catalogue de boosts si applicable
      if (p.allowBoosts && p.status === 'Open' && p.myVote) {
        boostService.getCatalog().then(setCatalog).catch(() => {})
      }
    } catch { setError('Pronostic introuvable.') }
    finally { setIsLoading(false) }
  }, [shareCode, navigate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const id = setInterval(async () => {
      if (!shareCode) return
      try {
        const p = await predictionService.getByShareCode(shareCode)
        if (p.status === 'Resolved') navigate(`/p/${shareCode}/result`, { replace: true })
        else setPrediction(p)
      } catch { /* silencieux */ }
    }, 15_000)
    return () => clearInterval(id)
  }, [shareCode, navigate])

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
        <p className="text-xl font-bold mb-4" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>{error ?? 'Introuvable.'}</p>
        <Link to="/" style={{ color: '#c8880c' }}>Retour</Link>
      </div>
    </div>
  )

  const myVoteOption   = prediction.myVote ? prediction.options.find(o => o.id === prediction.myVote!.optionId) : null
  const mySecondOption = prediction.myVote?.secondOptionId ? prediction.options.find(o => o.id === prediction.myVote!.secondOptionId) : null
  const isCreator      = user?.id === prediction.creatorId
  const votesOpen      = prediction.status === 'Open'
  const votesClosed    = prediction.status === 'VoteClosed' || prediction.status === 'AwaitingResolution'
  const showBoosts     = votesOpen && !!prediction.myVote && prediction.allowBoosts && catalog.length > 0

  return (
    <div style={pageStyle} className="flex flex-col">
      <div className="max-w-xl mx-auto px-4 py-10 flex-1 w-full">

        <div className="flex items-center justify-between mb-8">
          <Link to={`/p/${shareCode}`} className="text-sm transition" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
            ← Pronostic
          </Link>
          <button
            onClick={copyLink}
            className="text-sm px-4 py-2 rounded transition"
            style={{ background: '#161209', border: '1px solid #6b5010', color: copied ? '#f5c842' : '#8a7a5a', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}
          >
            {copied ? '✓ Copié !' : '◈ Partager'}
          </button>
        </div>

        <div className="text-center mb-10">
          {votesOpen && (
            <>
              <p className="text-5xl mb-4" style={{ color: '#c8880c' }}>⏳</p>
              <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
                Votes en cours
              </h1>
              <p className="text-sm" style={{ color: '#6b5010' }}>Orakl attend que ses fidèles se prononcent.</p>
            </>
          )}
          {votesClosed && (
            <>
              <p className="text-5xl mb-4" style={{ animation: 'pulse 2s infinite', color: '#c8880c' }}>🔮</p>
              <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
                Votes scellés !
              </h1>
              {revealCountdown.label ? (
                <>
                  <p className="text-sm mb-3" style={{ color: '#6b5010' }}>Révélation dans</p>
                  <div className="inline-block rounded px-8 py-4" style={{ background: '#161209', border: '1px solid #c8880c', boxShadow: '0 0 30px #c8880c30' }}>
                    <p className="text-4xl font-mono font-black tracking-widest" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                      {revealCountdown.label}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm" style={{ color: '#6b5010' }}>Orakl délibère. Personne ne sait combien de temps ça prendra.</p>
              )}
            </>
          )}
        </div>

        {myVoteOption && (
          <div className="relative p-5 rounded mb-5" style={{ background: '#161209', border: '1px solid #6b5010' }}>
            <span style={{ position:'absolute', top:6, left:6, color:'#c8880c', fontSize:'8px' }}>◆</span>
            <span style={{ position:'absolute', top:6, right:6, color:'#c8880c', fontSize:'8px' }}>◆</span>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>Ta prophétie</p>
            <p className="text-lg font-bold mb-1" style={{ color: '#f0dfa8', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>« {prediction.question} »</p>
            <div className="mt-3 rounded px-4 py-3 flex items-center gap-3" style={{ background: '#1e1810', border: '1px solid #c8880c' }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#c8880c' }} />
              <p className="font-semibold" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>{myVoteOption.label}</p>
            </div>
            {mySecondOption && (
              <div className="mt-2 rounded px-4 py-3 flex items-center gap-3" style={{ background: '#1a1a2e', border: '1px solid #4a4a8a' }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#7070d0' }} />
                <p className="text-sm font-semibold" style={{ color: '#a0a0f0', fontFamily: '"Cinzel", serif' }}>{mySecondOption.label}</p>
                <span className="ml-auto text-xs" style={{ color: '#4a4a8a' }}>2ᵉ vote</span>
              </div>
            )}
          </div>
        )}

        <div className="relative p-5 rounded mb-5" style={{ background: '#161209', border: '1px solid #6b5010' }}>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-black" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>{prediction.participantCount}</p>
              <p className="text-xs mt-1" style={{ color: '#6b5010' }}>initiés</p>
            </div>
            <div>
              <p className="text-3xl font-black" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>{prediction.baseReward}</p>
              <p className="text-xs mt-1" style={{ color: '#6b5010' }}>pts en jeu</p>
            </div>
          </div>
          {prediction.isAnonymous && (
            <div className="mt-4 pt-4 border-t text-center" style={{ borderColor: '#2a2218' }}>
              <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif' }}>
                <span>◉</span>
                <span>Prophétie Aveugle — Orakl garde le secret des votes</span>
              </p>
            </div>
          )}
        </div>

        {showBoosts && (
          <BoostPanel
            prediction={prediction}
            catalog={catalog}
            onCorrectionApplied={load}
          />
        )}

        {isCreator && votesClosed && (
          <div className="rounded p-5 text-center" style={{ background: '#1a1208', border: '1px solid #c8880c', boxShadow: '0 0 20px #c8880c20' }}>
            <p className="font-semibold mb-1" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>Tu es la Main d'Orakl.</p>
            <p className="text-sm mb-4" style={{ color: '#6b5010' }}>Transmets son verdict. Nul ne peut le contester.</p>
            <button
              onClick={() => navigate(`/p/${shareCode}/result`)}
              className="font-bold px-6 py-3 rounded transition"
              style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', fontSize: '0.8rem', border: '1px solid #f5c842' }}
            >
              ✦ Parler au nom d'Orakl
            </button>
          </div>
        )}

        {votesOpen && !myVoteOption && (
          <div className="text-center">
            <button
              onClick={() => navigate(`/p/${shareCode}/vote`)}
              className="font-bold px-8 py-3 rounded transition"
              style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', fontSize: '0.8rem', border: '1px solid #f5c842' }}
            >
              ✦ Voter maintenant
            </button>
          </div>
        )}

        {votesClosed && !isCreator && (
          <p className="text-center text-xs mt-4" style={{ color: '#2a2218' }}>
            La page se met à jour automatiquement toutes les 15 secondes.
          </p>
        )}
      </div>
    </div>
  )
}
