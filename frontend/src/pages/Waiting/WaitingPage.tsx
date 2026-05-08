import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { boostService }      from '../../services/boostService'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'
import type { Prediction, BoostCatalogItem, BoostUsageResponse } from '../../types'
import BoostPanel from './BoostPanel'
import { usePageTitle } from '../../hooks/usePageTitle'

// ─── Countdown ────────────────────────────────────────────────────────────────

function normalizeDate(s: string) {
  return /[Zz]$|[+\-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z'
}

function useCountdown(targetDate: string | undefined) {
  const calc = () => targetDate
    ? Math.max(0, new Date(normalizeDate(targetDate)).getTime() - Date.now())
    : null
  const [ms, setMs] = useState<number | null>(calc)
  useEffect(() => {
    const id = setInterval(() => setMs(calc()), 1000)
    return () => clearInterval(id)
  }, [targetDate])
  if (ms === null) return { h: null, m: null, s: null, label: null, expired: false }
  if (ms === 0)    return { h: 0, m: 0, s: 0, label: null, expired: true }
  const total = Math.floor(ms / 1000)
  const h     = Math.floor(total / 3600)
  const m     = Math.floor((total % 3600) / 60)
  const s     = total % 60
  const label = h > 0
    ? `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
    : m > 0 ? `${m}m ${String(s).padStart(2,'0')}s` : `${s}s`
  return { h, m, s, label, expired: false }
}

// ─── Cellule du timer ─────────────────────────────────────────────────────────

function TimerCell({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded px-3 py-2 min-w-[56px] text-center"
        style={{ background: '#161209', border: '1px solid #c8880c', boxShadow: '0 0 16px #c8880c20' }}>
        <span className="text-3xl font-black tabular-nums" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif', letterSpacing: '0.05em' }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs mt-1" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif', letterSpacing: '0.06em' }}>
        {unit}
      </span>
    </div>
  )
}

// ─── Badge statut ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = status === 'Open'
    ? { label: 'Vote ouvert',              bg: '#0e1a0e', border: '#3a8a20', color: '#a0ff70' }
    : status === 'VoteClosed'
    ? { label: 'Votes scellés',            bg: '#1a100a', border: '#c8880c', color: '#f5c842' }
    : { label: 'En attente de révélation', bg: '#1a100a', border: '#c8880c', color: '#f5c842' }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontFamily: '"Cinzel", serif', letterSpacing: '0.05em' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }
const cardStyle = { background: '#161209', border: '1px solid #6b5010', borderRadius: '6px' } as const

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WaitingPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [prediction, setPrediction]   = useState<Prediction | null>(null)

  usePageTitle(prediction ? `En attente — ${prediction.question}` : 'En attente')
  const [catalog, setCatalog]         = useState<BoostCatalogItem[]>([])
  const [boostUsages, setBoostUsages] = useState<BoostUsageResponse[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)
  const revealCountdown = useCountdown(prediction?.revealDate)

  const load = useCallback(async () => {
    if (!shareCode) return
    try {
      const p = await predictionService.getByShareCode(shareCode)
      if (p.status === 'Resolved') { navigate(`/p/${shareCode}/result`, { replace: true }); return }
      if (p.status === 'Open' && !p.myVote) { navigate(`/p/${shareCode}/vote`, { replace: true }); return }
      setPrediction(p)
      if (p.allowBoosts && p.status === 'Open' && p.myVote) {
        boostService.getCatalog().then(setCatalog).catch(() => {})
        boostService.getUsages(p.id).then(setBoostUsages).catch(() => {})
      }
    } catch { setError('Pronostic introuvable.') }
    finally { setIsLoading(false) }
  }, [shareCode, navigate])

  useEffect(() => { load() }, [load])

  // Rafraîchissement automatique toutes les 15 s
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

  const handleBoostUsed = useCallback(() => {
    boostService.getCatalog().then(setCatalog).catch(() => {})
    if (prediction) boostService.getUsages(prediction.id).then(setBoostUsages).catch(() => {})
  }, [prediction])

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )

  // ── Erreur ───────────────────────────────────────────────────────────────

  if (error || !prediction) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="text-center">
          <p className="text-4xl mb-4" style={{ color: '#c8880c' }}>✦</p>
          <p className="text-xl font-bold mb-4" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>
            {error ?? 'Introuvable.'}
          </p>
          <Link to="/" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.875rem' }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )

  // ── Dérivations ──────────────────────────────────────────────────────────

  const findOption = (id?: string | null) =>
    id ? prediction.options.find(o => o.id.toLowerCase() === id.toLowerCase()) : undefined

  const myVoteOption   = prediction.myVote ? findOption(prediction.myVote.optionId)       : null
  const mySecondOption = prediction.myVote?.secondOptionId ? findOption(prediction.myVote.secondOptionId) : null
  const isCreator      = user?.id === prediction.creatorId
  const votesOpen      = prediction.status === 'Open'
  const votesClosed    = prediction.status === 'VoteClosed' || prediction.status === 'AwaitingResolution'
  const showBoosts     = votesOpen && !!prediction.myVote && prediction.allowBoosts && catalog.length > 0
  const hasActiveShield = boostUsages.some(u => u.boostType === 'Shield' && !u.wasBlocked)

  const shareUrl = `${window.location.origin}/p/${shareCode}`

  // ── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Barre navigation + partage */}
        <div className="flex items-center justify-between mb-6">
          <Link to={`/p/${shareCode}`} className="text-sm transition"
            style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
            ← Pronostic
          </Link>
          <StatusBadge status={prediction.status} />
        </div>

        {/* ── Section statut ─────────────────────────────────────────────── */}

        {votesOpen && (
          <div className="text-center mb-8">
            <p className="text-5xl mb-4" style={{ color: '#c8880c' }}>⏳</p>
            <h1 className="text-2xl font-extrabold mb-2"
              style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
              Votes en cours
            </h1>
            <p className="text-sm" style={{ color: '#6b5010' }}>
              Orakl attend que ses fidèles se prononcent.
            </p>
          </div>
        )}

        {votesClosed && (
          <div className="text-center mb-8">
            <p className="text-5xl mb-4" style={{ color: '#c8880c' }}>🔮</p>
            <h1 className="text-2xl font-extrabold mb-2"
              style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
              Votes scellés !
            </h1>

            {revealCountdown.label ? (
              <div>
                <p className="text-sm mb-4" style={{ color: '#6b5010' }}>Révélation dans</p>
                <div className="flex items-end justify-center gap-3">
                  {(revealCountdown.h ?? 0) > 0 && (
                    <TimerCell value={revealCountdown.h!} unit="heures" />
                  )}
                  <TimerCell value={revealCountdown.m!} unit="min" />
                  <TimerCell value={revealCountdown.s!} unit="sec" />
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#6b5010' }}>
                Orakl délibère. Personne ne sait combien de temps ça prendra.
              </p>
            )}
          </div>
        )}

        {/* ── Carte "Ton vote" ──────────────────────────────────────────── */}

        {myVoteOption && (
          <div className="relative p-5 rounded mb-5" style={cardStyle}>
            <span style={{ position:'absolute', top:6, left:6,  color:'#c8880c', fontSize:'8px' }}>◆</span>
            <span style={{ position:'absolute', top:6, right:6, color:'#c8880c', fontSize:'8px' }}>◆</span>

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wide"
                style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
                Ta prophétie
              </p>
              {hasActiveShield && (
                <span className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: '#0a1828', border: '1px solid #2060a0', color: '#60b0ff', fontFamily: '"Cinzel", serif' }}>
                  🛡 Bouclier actif
                </span>
              )}
            </div>

            <p className="text-base font-bold italic mb-3"
              style={{ color: '#f0dfa8', fontFamily: '"Lora", serif' }}>
              « {prediction.question} »
            </p>

            {/* Vote principal */}
            <div className="rounded px-4 py-3 flex items-center gap-3 mb-2"
              style={{ background: '#1e1810', border: '1px solid #c8880c' }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#c8880c' }} />
              <p className="font-semibold" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                {myVoteOption.label}
              </p>
            </div>

            {/* Second vote */}
            {mySecondOption && (
              <div className="rounded px-4 py-3 flex items-center gap-3"
                style={{ background: '#1a1a2e', border: '1px solid #4a4a8a' }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#7070d0' }} />
                <p className="text-sm font-semibold" style={{ color: '#a0a0f0', fontFamily: '"Cinzel", serif' }}>
                  {mySecondOption.label}
                </p>
                <span className="ml-auto text-xs" style={{ color: '#4a4a8a' }}>2ᵉ vote</span>
              </div>
            )}

            {/* Contexte */}
            {prediction.context && (
              <p className="text-xs italic mt-3" style={{ color: '#3a2d10' }}>
                {prediction.context}
              </p>
            )}
          </div>
        )}

        {/* ── Stats ─────────────────────────────────────────────────────── */}

        <div className="relative p-5 rounded mb-5" style={cardStyle}>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-black" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                {prediction.participantCount}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b5010' }}>initiés</p>
            </div>
            <div>
              <p className="text-3xl font-black" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                {prediction.baseReward}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b5010' }}>pts en jeu</p>
            </div>
          </div>
          {prediction.isAnonymous && (
            <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid #2a2218' }}>
              <p className="text-xs flex items-center justify-center gap-1.5"
                style={{ color: '#c8880c', fontFamily: '"Cinzel", serif' }}>
                <span>◉</span>
                <span>Prophétie Aveugle — Orakl garde le secret des votes</span>
              </p>
            </div>
          )}
        </div>

        {/* ── Section partage ─────────────────────────────────────────── */}

        <div className="relative p-5 rounded mb-5" style={cardStyle}>
          <p className="text-xs uppercase tracking-wide mb-3"
            style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
            Inviter des initiés
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded px-3 py-2 overflow-hidden"
              style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
              <p className="text-xs truncate" style={{ color: '#3a2d10', fontFamily: 'monospace' }}>
                {shareUrl}
              </p>
            </div>
            <button
              onClick={copyLink}
              className="flex-shrink-0 text-sm px-4 py-2 rounded transition font-semibold"
              style={{
                background: copied ? '#1a2810' : '#161209',
                border: `1px solid ${copied ? '#3a8a20' : '#6b5010'}`,
                color: copied ? '#a0ff70' : '#8a7a5a',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copié' : '◈ Copier'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#2a2218' }}>
            Partage ce lien pour que tes amis rejoignent la prophétie.
          </p>
        </div>

        {/* ── BoostPanel ───────────────────────────────────────────────── */}

        {showBoosts && (
          <BoostPanel
            prediction={prediction}
            catalog={catalog}
            onCorrectionApplied={load}
            onBoostUsed={handleBoostUsed}
          />
        )}

        {/* ── CTA créateur : révéler ───────────────────────────────────── */}

        {isCreator && votesClosed && (
          <div className="rounded p-5 text-center mb-4"
            style={{ background: '#1a1208', border: '1px solid #c8880c', boxShadow: '0 0 24px #c8880c20' }}>
            <p className="font-semibold mb-1" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
              Tu es la Main d'Orakl.
            </p>
            <p className="text-sm mb-4" style={{ color: '#6b5010' }}>
              Transmets son verdict. Nul ne peut le contester.
            </p>
            <button
              onClick={() => navigate(`/p/${shareCode}/result`)}
              className="font-bold px-6 py-3 rounded transition flex items-center gap-2 mx-auto"
              style={{
                background: 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
                color: '#0e0c08',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.8rem',
                border: '1px solid #f5c842',
                boxShadow: '0 0 20px #c8880c40',
                cursor: 'pointer',
              }}
            >
              ⚖ Parler au nom d'Orakl
            </button>
          </div>
        )}

        {/* ── CTA voter (créateur, votes ouverts, pas encore voté) ─────── */}

        {votesOpen && !myVoteOption && (
          <div className="text-center mb-4">
            <button
              onClick={() => navigate(`/p/${shareCode}/vote`)}
              className="font-bold px-8 py-3 rounded transition"
              style={{
                background: 'linear-gradient(135deg, #a36808, #c8880c)',
                color: '#0e0c08',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.8rem',
                border: '1px solid #f5c842',
                cursor: 'pointer',
              }}
            >
              ✦ Voter maintenant
            </button>
          </div>
        )}

        {/* ── Indicateur auto-refresh ──────────────────────────────────── */}

        {votesClosed && !isCreator && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#3a2d10' }} />
            <p className="text-xs" style={{ color: '#2a2218' }}>
              Mise à jour automatique toutes les 15 s
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
