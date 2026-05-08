import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import { boostService }      from '../../services/boostService'
import { useAuth }           from '../../context/AuthContext'
import { useToast }          from '../../context/ToastContext'
import Navbar from '../../components/layout/Navbar'
import type { Prediction, PredictionOption } from '../../types'
import { usePageTitle } from '../../hooks/usePageTitle'

// ─── Countdown ────────────────────────────────────────────────────────────────

function normalizeDate(s: string) {
  return /[Zz]$|[+\-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z'
}

function useCountdown(deadline: string) {
  const calc = () => Math.max(0, new Date(normalizeDate(deadline)).getTime() - Date.now())
  const [ms, setMs] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setMs(calc()), 1000)
    return () => clearInterval(id)
  }, [deadline])
  const total = Math.floor(ms / 1000)
  const h     = Math.floor(total / 3600)
  const m     = Math.floor((total % 3600) / 60)
  const s     = total % 60
  return { expired: ms === 0, h, m, s, urgent: total < 60, veryUrgent: total < 10 }
}

// ─── Cellule timer ───────────────────────────────────────────────────────────

function TimerCell({ value, unit, urgent }: { value: number; unit: string; urgent: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded px-2.5 py-1.5 min-w-[48px] text-center"
        style={{
          background: urgent ? '#2a0c0c' : '#161209',
          border: `1px solid ${urgent ? '#9a2020' : '#c8880c'}`,
          boxShadow: urgent ? '0 0 12px #9a202040' : '0 0 12px #c8880c20',
        }}>
        <span className="text-2xl font-black tabular-nums"
          style={{ color: urgent ? '#e05050' : '#f5c842', fontFamily: '"Cinzel", serif', letterSpacing: '0.04em' }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs mt-1"
        style={{ color: urgent ? '#6b2020' : '#6b5010', fontFamily: '"Cinzel", serif', letterSpacing: '0.06em' }}>
        {unit}
      </span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }
const cardStyle = { background: '#161209', border: '1px solid #6b5010', borderRadius: '6px' } as const

// ─── VotePage ────────────────────────────────────────────────────────────────

export default function VotePage() {
  const { shareCode }       = useParams<{ shareCode: string }>()
  const navigate            = useNavigate()
  const { isAuthenticated } = useAuth()
  const { error: toastError, info } = useToast()

  const [prediction, setPrediction]         = useState<Prediction | null>(null)

  usePageTitle(prediction ? `Voter — ${prediction.question}` : 'Voter')
  const [selected, setSelected]             = useState<PredictionOption | null>(null)
  const [secondSelected, setSecondSelected] = useState<PredictionOption | null>(null)
  const [hasDoubleVote, setHasDoubleVote]   = useState(false)
  const [useDoubleVote, setUseDoubleVote]   = useState(false)
  const [isLoading, setIsLoading]           = useState(true)
  const [isSubmitting, setIsSubmitting]     = useState(false)
  const [voted, setVoted]                   = useState(false)
  const [votedOptions, setVotedOptions]     = useState<{ primary: string; secondary?: string }>({ primary: '' })
  const [error, setError]                   = useState<string | null>(null)

  useEffect(() => {
    if (!shareCode) return
    predictionService.getByShareCode(shareCode)
      .then(p => {
        if (p.myVote)            return navigate(`/p/${shareCode}/waiting`, { replace: true })
        if (p.status !== 'Open') return navigate(`/p/${shareCode}`, { replace: true })
        setPrediction(p)
        if (isAuthenticated && p.allowBoosts) {
          boostService.getCatalog()
            .then(catalog => {
              const dv = catalog.find(b => b.boostType === 'SecondVote')
              setHasDoubleVote((dv?.ownedQuantity ?? 0) > 0)
            })
            .catch(() => {})
        }
      })
      .catch(() => setError('Pronostic introuvable.'))
      .finally(() => setIsLoading(false))
  }, [shareCode, navigate, isAuthenticated])

  const deadline  = prediction?.voteDeadline ?? new Date(Date.now() + 99_999_999).toISOString()
  const countdown = useCountdown(deadline)

  useEffect(() => {
    if (countdown.expired && prediction) navigate(`/p/${shareCode}/waiting`, { replace: true })
  }, [countdown.expired])

  useEffect(() => { setSecondSelected(null) }, [selected, useDoubleVote])

  const handleVote = async () => {
    if (!selected || !prediction) return
    if (!isAuthenticated) { navigate('/login'); return }
    if (useDoubleVote && !secondSelected) { setError('Choisis aussi ton second pronostic.'); return }
    setIsSubmitting(true); setError(null)
    try {
      await predictionService.vote(prediction.id, selected.id, useDoubleVote ? secondSelected?.id : undefined)
      setVotedOptions({ primary: selected.label, secondary: useDoubleVote && secondSelected ? secondSelected.label : undefined })
      setVoted(true)
      info('Prophétie scellée ! Redirection en cours…')
      setTimeout(() => navigate(`/p/${shareCode}/waiting`), 2500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur lors du vote.'
      setError(msg)
      toastError(msg)
    } finally { setIsSubmitting(false) }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )

  // ── Erreur / introuvable ───────────────────────────────────────────────────

  if (!prediction) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="text-center">
          <p className="text-4xl mb-4" style={{ color: '#c8880c' }}>✦</p>
          <p className="text-xl font-bold mb-4" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>
            {error ?? 'Pronostic introuvable'}
          </p>
          <Link to="/" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.875rem' }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )

  // ── Écran de confirmation post-vote ───────────────────────────────────────

  if (voted) return (
    <div style={pageStyle}>
      <Navbar />
      <style>{`
        @keyframes seal-pulse {
          0%, 100% { transform: scale(1);   opacity: 1;    text-shadow: 0 0 20px #f5c84280; }
          50%       { transform: scale(1.15); opacity: 0.9; text-shadow: 0 0 40px #f5c842cc; }
        }
        .seal-anim { animation: seal-pulse 2s ease-in-out infinite; display: inline-block; }
      `}</style>
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="text-center max-w-sm w-full">
          <div className="text-6xl mb-5 seal-anim" style={{ color: '#f5c842' }}>✦</div>
          <h1 className="text-2xl font-extrabold mb-2"
            style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
            Prophétie scellée !
          </h1>
          <p className="text-sm mb-5" style={{ color: '#6b5010' }}>
            Orakl a enregistré ta volonté.
          </p>

          <div className="rounded p-4 space-y-2" style={cardStyle}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded"
              style={{ background: '#1e1810', border: '1px solid #c8880c' }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#c8880c' }} />
              <p className="font-semibold text-sm" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                {votedOptions.primary}
              </p>
            </div>
            {votedOptions.secondary && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded"
                style={{ background: '#1a1a2e', border: '1px solid #4a4a8a' }}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#7070d0' }} />
                <p className="text-sm font-semibold" style={{ color: '#a0a0f0', fontFamily: '"Cinzel", serif' }}>
                  {votedOptions.secondary}
                </p>
                <span className="ml-auto text-xs" style={{ color: '#4a4a8a' }}>2ᵉ vote</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#3a2d10' }} />
            <p className="text-xs" style={{ color: '#3a2d10' }}>Redirection en cours…</p>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Vue principale ────────────────────────────────────────────────────────

  const sortedOptions = [...prediction.options].sort((a, b) => a.sortOrder - b.sortOrder)
  const secondOptions = sortedOptions.filter(o => o.id !== selected?.id)
  const canSubmit     = !!selected && (!useDoubleVote || !!secondSelected) && !isSubmitting
  const step2Active   = useDoubleVote && !!selected

  return (
    <div style={pageStyle}>
      <Navbar />

      <style>{`
        @keyframes urgent-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        .urgent-blink { animation: urgent-pulse 0.8s ease-in-out infinite; }
      `}</style>

      <div className="max-w-xl mx-auto px-4 py-8">

        {/* ── Barre du haut : retour + timer ─────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <Link to={`/p/${shareCode}`} className="text-sm transition"
            style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
            ← Retour
          </Link>

          {/* Timer */}
          <div className={`flex items-center gap-2 ${countdown.veryUrgent ? 'urgent-blink' : ''}`}>
            <span className="text-xs" style={{ color: countdown.urgent ? '#6b2020' : '#6b5010', fontFamily: '"Cinzel", serif' }}>
              Temps restant
            </span>
            <div className="flex items-end gap-1.5">
              {countdown.h > 0 && <TimerCell value={countdown.h} unit="h" urgent={countdown.urgent} />}
              <TimerCell value={countdown.m} unit="min" urgent={countdown.urgent} />
              <TimerCell value={countdown.s} unit="s"   urgent={countdown.urgent} />
            </div>
          </div>
        </div>

        {/* ── Carte question ─────────────────────────────────────────── */}
        <div className="relative p-6 rounded mb-5 shadow-2xl" style={cardStyle}>
          <span style={{ position:'absolute', top:8,    left:8,   color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', top:8,    right:8,  color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, left:8,   color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, right:8,  color:'#c8880c', fontSize:'10px' }}>◆</span>

          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
              Prophétie de <span style={{ color: '#c8880c' }}>{prediction.creatorName}</span>
            </p>
            <div className="flex items-center gap-2">
              {prediction.isAnonymous && (
                <span className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background:'#1a1208', border:'1px solid #c8880c', color:'#f5c842', fontFamily:'"Cinzel", serif', letterSpacing:'0.04em' }}>
                  ◉ Aveugle
                </span>
              )}
              {/* Badge récompense */}
              <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                style={{ background:'#1e1810', border:'1px solid #6b5010', color:'#c8880c', fontFamily:'"Cinzel", serif' }}>
                ⚖ {prediction.baseReward} pts
              </span>
            </div>
          </div>

          <h1 className="text-xl font-extrabold leading-snug mb-1"
            style={{ fontFamily: '"Lora", serif', color: '#f0dfa8', fontStyle: 'italic' }}>
            « {prediction.question} »
          </h1>

          {prediction.context && (
            <p className="text-sm italic mt-2" style={{ color: '#6b5010' }}>{prediction.context}</p>
          )}

          {prediction.isAnonymous && (
            <p className="text-xs mt-2" style={{ color: '#3a2d10' }}>
              Orakl garde le secret des votes jusqu'à la révélation.
            </p>
          )}

          {/* Séparateur */}
          <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', margin:'20px 0' }} />

          {/* ── Toggle Double Vote ──────────────────────────────────── */}
          {hasDoubleVote && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded"
              style={{ background: '#1a1208', border: `1px solid ${useDoubleVote ? '#c8880c' : '#3a2d10'}`, transition: 'border-color 0.2s' }}>
              <button
                onClick={() => setUseDoubleVote(v => !v)}
                className="flex-shrink-0 w-10 h-5 rounded-full relative transition-colors"
                style={{ background: useDoubleVote ? '#c8880c' : '#2a2218', border: '1px solid #6b5010' }}
              >
                <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{ background: '#f0dfa8', left: useDoubleVote ? '20px' : '2px' }} />
              </button>
              <div>
                <p className="text-xs font-semibold" style={{ fontFamily: '"Cinzel", serif', color: '#f5c842' }}>
                  ✦ Double Vote
                </p>
                <p className="text-xs" style={{ color: '#6b5010' }}>
                  Parie sur deux réponses — récompense réduite à 60 % si tu gagnes.
                </p>
              </div>
            </div>
          )}

          {/* ── Indicateur d'étape (double vote) ────────────────────── */}
          {useDoubleVote && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: selected ? '#c8880c' : '#3a2d10', color: selected ? '#0e0c08' : '#6b5010', fontFamily: '"Cinzel", serif' }}>
                  1
                </div>
                <span className="text-xs" style={{ color: selected ? '#c8880c' : '#3a2d10', fontFamily: '"Cinzel", serif' }}>
                  {selected ? selected.label : 'Premier choix'}
                </span>
              </div>
              <div className="flex-1 h-px" style={{ background: '#2a2218' }} />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: secondSelected ? '#7070d0' : '#2a2218', color: secondSelected ? '#0e0c08' : '#6b5010', fontFamily: '"Cinzel", serif' }}>
                  2
                </div>
                <span className="text-xs" style={{ color: secondSelected ? '#a0a0f0' : '#3a2d10', fontFamily: '"Cinzel", serif' }}>
                  {secondSelected ? secondSelected.label : 'Second choix'}
                </span>
              </div>
            </div>
          )}

          {/* ── Options premier choix ────────────────────────────────── */}
          <p className="text-xs font-semibold mb-3 uppercase tracking-wider"
            style={{ fontFamily: '"Cinzel", serif', color: '#3a2d10' }}>
            {useDoubleVote ? 'Étape 1 — Premier choix' : 'Soumets-toi au jugement d\'Orakl'}
          </p>
          <OptionList
            options={sortedOptions}
            selected={selected}
            onSelect={setSelected}
            variant="primary"
          />

          {/* ── Options second choix ─────────────────────────────────── */}
          {step2Active && (
            <>
              <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #4a4a8a, transparent)', margin:'20px 0' }} />
              <p className="text-xs font-semibold mb-3 uppercase tracking-wider"
                style={{ fontFamily: '"Cinzel", serif', color: '#3a2d10' }}>
                Étape 2 — Second choix
              </p>
              <OptionList
                options={secondOptions}
                selected={secondSelected}
                onSelect={setSecondSelected}
                variant="secondary"
              />
            </>
          )}

          {/* ── Erreur ──────────────────────────────────────────────── */}
          {error && (
            <div className="mt-4 rounded px-4 py-3 text-sm"
              style={{ background: '#2a0c0c', border: '1px solid #6b2020', color: '#e05050' }}>
              {error}
            </div>
          )}

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <div className="mt-6">
            {!isAuthenticated && (
              <p className="text-xs text-center mb-3" style={{ color: '#6b5010' }}>
                <Link to="/login" style={{ color: '#c8880c' }}>Connecte-toi</Link> pour voter et conserver tes points.
              </p>
            )}
            <button
              onClick={handleVote}
              disabled={!canSubmit}
              className="w-full font-bold py-3.5 rounded text-sm transition flex items-center justify-center gap-2"
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)'
                  : '#2a2218',
                color: canSubmit ? '#0e0c08' : '#3a2d10',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.8rem',
                border: `1px solid ${canSubmit ? '#f5c842' : '#2a2218'}`,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                letterSpacing: '0.06em',
                boxShadow: canSubmit ? '0 0 24px #c8880c40' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {isSubmitting && (
                <span className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#0e0c08', borderTopColor: 'transparent' }} />
              )}
              {isSubmitting
                ? 'Orakl enregistre ton choix…'
                : useDoubleVote && selected && secondSelected
                  ? `✦ Sceller — « ${selected.label} » & « ${secondSelected.label} »`
                  : selected
                    ? `✦ Voter pour « ${selected.label} »`
                    : useDoubleVote && !selected
                      ? 'Choisis ton premier pronostic'
                      : 'Soumets-toi au jugement'
              }
            </button>
          </div>
        </div>

        {/* ── Pied de page : stats ─────────────────────────────────── */}
        <div className="flex items-center justify-center gap-6 text-xs" style={{ color: '#2a2218' }}>
          <span>👥 {prediction.participantCount} participants</span>
          <span style={{ color: '#1e1810' }}>·</span>
          <span>⚖ {prediction.baseReward} pts en jeu</span>
        </div>

      </div>
    </div>
  )
}

// ─── Sous-composant liste d'options ──────────────────────────────────────────

function OptionList({
  options,
  selected,
  onSelect,
  variant,
}: {
  options: PredictionOption[]
  selected: PredictionOption | null
  onSelect: (o: PredictionOption | null) => void
  variant: 'primary' | 'secondary'
}) {
  const accentColor   = variant === 'primary' ? '#c8880c' : '#7070d0'
  const selectedBg    = variant === 'primary' ? '#1e1810' : '#1a1a2e'
  const selectedBorder = variant === 'primary' ? '#c8880c' : '#4a4a8a'
  const selectedColor = variant === 'primary' ? '#f5c842' : '#a0a0f0'
  const selectedGlow  = variant === 'primary' ? '#c8880c30' : '#7070d030'

  return (
    <div className="space-y-2.5">
      {options.map((option, idx) => {
        const isSel = selected?.id === option.id
        return (
          <button
            key={option.id}
            onClick={() => onSelect(isSel ? null : option)}
            className="w-full text-left rounded px-4 py-3.5 transition-all group"
            style={{
              background: isSel ? selectedBg : '#0e0c08',
              border: `1px solid ${isSel ? selectedBorder : '#2a2218'}`,
              boxShadow: isSel ? `0 0 20px ${selectedGlow}` : 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!isSel) {
                (e.currentTarget as HTMLElement).style.borderColor = '#3a2d10'
                ;(e.currentTarget as HTMLElement).style.background = '#0f0d09'
              }
            }}
            onMouseLeave={e => {
              if (!isSel) {
                (e.currentTarget as HTMLElement).style.borderColor = '#2a2218'
                ;(e.currentTarget as HTMLElement).style.background = '#0e0c08'
              }
            }}
          >
            <div className="flex items-center gap-3">
              {/* Radio */}
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                style={{ borderColor: isSel ? accentColor : '#3a2d10', background: isSel ? accentColor : 'transparent' }}
              >
                {isSel && <div className="w-2 h-2 rounded-full" style={{ background: '#0e0c08' }} />}
              </div>

              {/* Texte */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm"
                  style={{ color: isSel ? selectedColor : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                  {option.label}
                </p>
                {option.description && (
                  <p className="text-xs mt-0.5" style={{ color: isSel ? '#6b5010' : '#3a2d10' }}>
                    {option.description}
                  </p>
                )}
              </div>

              {/* Numéro discret */}
              <span className="flex-shrink-0 text-xs tabular-nums"
                style={{ color: isSel ? accentColor : '#2a2218', fontFamily: '"Cinzel", serif' }}>
                {idx + 1}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
