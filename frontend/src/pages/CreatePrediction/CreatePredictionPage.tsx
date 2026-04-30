import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'
import Navbar from '../../components/layout/Navbar'

interface OptionDraft {
  id: string
  label: string
  description: string
}

type Step = 'question' | 'options' | 'settings' | 'review'
const STEPS: Step[] = ['question', 'options', 'settings', 'review']
const STEP_LABELS: Record<Step, string> = {
  question: 'Oracle',
  options:  'Choix',
  settings: 'Rites',
  review:   'Sceau',
}

const inputStyle = {
  width: '100%',
  background: '#0e0c08',
  border: '1px solid #6b5010',
  color: '#f0dfa8',
  borderRadius: '4px',
  padding: '10px 16px',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
  resize: 'vertical' as const,
}

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontFamily: '"Cinzel", serif',
  color: '#8a7a5a',
  marginBottom: '6px',
  letterSpacing: '0.08em',
}

export default function CreatePredictionPage() {
  const navigate = useNavigate()

  const [step, setStep]           = useState<Step>('question')
  const [question, setQuestion]   = useState('')
  const [context, setContext]     = useState('')
  const [options, setOptions]     = useState<OptionDraft[]>([
    { id: crypto.randomUUID(), label: '', description: '' },
    { id: crypto.randomUUID(), label: '', description: '' },
  ])
  const [voteDeadline, setVoteDeadline] = useState('')
  const [revealDate, setRevealDate]     = useState('')
  const [allowBoosts, setAllowBoosts]   = useState(true)
  const [allowSabotage, setAllowSabotage] = useState(true)
  const [baseReward, setBaseReward]     = useState(100)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const stepIndex = STEPS.indexOf(step)

  const canGoNext = () => {
    if (step === 'question') return question.trim().length >= 5
    if (step === 'options')  return options.filter(o => o.label.trim()).length >= 2
    if (step === 'settings') return voteDeadline !== ''
    return true
  }

  const goNext = () => { if (!canGoNext()) return; const next = STEPS[stepIndex + 1]; if (next) setStep(next) }
  const goPrev = () => { const prev = STEPS[stepIndex - 1]; if (prev) setStep(prev) }
  const addOption = () => { if (options.length >= 10) return; setOptions(prev => [...prev, { id: crypto.randomUUID(), label: '', description: '' }]) }
  const removeOption = (id: string) => { if (options.length <= 2) return; setOptions(prev => prev.filter(o => o.id !== id)) }
  const updateOption = (id: string, field: keyof OptionDraft, value: string) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o))
  }

  const handleSubmit = async (publish: boolean) => {
    setError(null)
    setIsLoading(true)
    try {
      const filledOptions = options
        .filter(o => o.label.trim())
        .map((o, i) => ({ label: o.label.trim(), description: o.description.trim() || undefined, sortOrder: i }))
      const prediction = await predictionService.create({
        question:     question.trim(),
        context:      context.trim() || undefined,
        options:      filledOptions as never,
        voteDeadline: new Date(voteDeadline).toISOString(),
        revealDate:   revealDate ? new Date(revealDate).toISOString() : undefined,
        allowBoosts, allowSabotage, baseReward,
      })
      if (publish) {
        const published = await predictionService.publish(prediction.id)
        navigate(`/p/${published.shareCode}`)
      } else {
        navigate(`/p/${prediction.shareCode}`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Une erreur est survenue.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0e0c08', color: '#f0dfa8' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-sm flex items-center gap-1 mb-4 transition"
            style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
            Invoquer un Pronostic
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b5010', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            Pose une question. Convoque tes amis. Révèle la vérité.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition"
                  style={{
                    fontFamily: '"Cinzel", serif',
                    border: `2px solid ${i < stepIndex ? '#c8880c' : i === stepIndex ? '#f5c842' : '#3a2d10'}`,
                    background: i < stepIndex ? '#c8880c' : '#0e0c08',
                    color: i < stepIndex ? '#0e0c08' : i === stepIndex ? '#f5c842' : '#3a2d10',
                  }}
                >
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{
                    fontFamily: '"Cinzel", serif',
                    color: i <= stepIndex ? '#c8880c' : '#3a2d10',
                    letterSpacing: '0.06em',
                  }}
                >
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1"
                  style={{ height:'1px', background: i < stepIndex ? '#c8880c' : '#2a2218' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="relative p-6 rounded shadow-2xl"
          style={{ background: '#161209', border: '1px solid #6b5010' }}
        >
          <span style={{ position:'absolute', top:8, left:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', top:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, left:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>

          {/* STEP: question */}
          {step === 'question' && (
            <div className="space-y-5">
              <div>
                <label style={labelStyle}>Ta question ✦</label>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Qui va arriver en retard dimanche ?"
                  rows={3}
                  maxLength={500}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
                />
                <p className="text-xs mt-1 text-right" style={{ color: '#3a2d10' }}>{question.length}/500</p>
              </div>

              <div>
                <label style={labelStyle}>Contexte <span style={{ color:'#3a2d10', fontFamily:'inherit', fontWeight:400 }}>(facultatif)</span></label>
                <textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Rendez-vous prévu à 14h devant la gare."
                  rows={2}
                  maxLength={1000}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
                />
              </div>

              <div className="rounded p-4" style={{ background:'#0e0c08', border:'1px solid #2a2218' }}>
                <p className="text-xs mb-2 font-medium" style={{ color:'#6b5010', fontFamily:'"Cinzel", serif' }}>
                  ✦ Inspiration oraculaire
                </p>
                {[
                  "Combien de temps avant que Lucas dise je lag ?",
                  "Qui va finir son assiette en premier ?",
                  "Est-ce que le film va être nul ?",
                ].map(ex => (
                  <button
                    key={ex}
                    onClick={() => setQuestion(ex)}
                    className="block text-xs py-0.5 text-left transition"
                    style={{ color:'#6b5010', fontStyle:'italic' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}
                  >
                    « {ex} »
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: options */}
          {step === 'options' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ fontFamily:'"Cinzel", serif', color:'#f0dfa8' }}>
                  Les possibles ✦
                </p>
                <p className="text-xs mb-4" style={{ color:'#6b5010' }}>Minimum 2, maximum 10 chemins vers la vérité.</p>
              </div>

              {options.map((opt, index) => (
                <div key={opt.id} className="flex gap-3 items-start group">
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs mt-2.5 font-bold"
                    style={{ background:'#0e0c08', border:'1px solid #6b5010', color:'#c8880c', fontFamily:'"Cinzel", serif' }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={e => updateOption(opt.id, 'label', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      maxLength={200}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
                    />
                    <input
                      type="text"
                      value={opt.description}
                      onChange={e => updateOption(opt.id, 'description', e.target.value)}
                      placeholder="Description (facultatif)"
                      maxLength={300}
                      style={{ ...inputStyle, background:'#0a0906', fontSize:'0.75rem', padding:'6px 12px' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
                    />
                  </div>
                  <button
                    onClick={() => removeOption(opt.id)}
                    disabled={options.length <= 2}
                    className="mt-2.5 transition text-lg leading-none"
                    style={{ color:'#3a2d10' }}
                    onMouseEnter={e => !e.currentTarget.disabled && ((e.currentTarget as HTMLElement).style.color = '#c84040')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#3a2d10')}
                  >
                    ×
                  </button>
                </div>
              ))}

              {options.length < 10 && (
                <button
                  onClick={addOption}
                  className="w-full py-3 text-sm transition flex items-center justify-center gap-2"
                  style={{
                    border:'2px dashed #3a2d10',
                    borderRadius:'4px',
                    color:'#6b5010',
                    fontFamily:'"Cinzel", serif',
                    fontSize:'0.75rem'
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#c8880c'; (e.currentTarget as HTMLElement).style.color='#c8880c' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#3a2d10'; (e.currentTarget as HTMLElement).style.color='#6b5010' }}
                >
                  ✦ Ajouter un chemin
                </button>
              )}
            </div>
          )}

          {/* STEP: settings */}
          {step === 'settings' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Fermeture des votes ✦</label>
                  <input
                    type="datetime-local"
                    value={voteDeadline}
                    onChange={e => setVoteDeadline(e.target.value)}
                    min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Révélation <span style={{ color:'#3a2d10', fontFamily:'inherit', fontWeight:400 }}>(facultatif)</span></label>
                  <input
                    type="datetime-local"
                    value={revealDate}
                    onChange={e => setRevealDate(e.target.value)}
                    min={voteDeadline || new Date().toISOString().slice(0, 16)}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Récompense de base</label>
                <div className="flex gap-3 flex-wrap">
                  {[50, 100, 150, 250, 500].map(r => (
                    <button
                      key={r}
                      onClick={() => setBaseReward(r)}
                      className="px-4 py-2 rounded text-sm font-semibold transition"
                      style={{
                        background: baseReward === r ? 'linear-gradient(135deg, #a36808, #c8880c)' : '#0e0c08',
                        border: `1px solid ${baseReward === r ? '#f5c842' : '#3a2d10'}`,
                        color: baseReward === r ? '#0e0c08' : '#6b5010',
                        fontFamily: '"Cinzel", serif',
                        fontSize: '0.75rem',
                      }}
                    >
                      {r} pts
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold" style={{ fontFamily:'"Cinzel", serif', color:'#f0dfa8' }}>
                  Pouvoirs autorisés
                </p>
                {[
                  { label: 'Boosts activés', desc: 'Correction, Double Vote, Bouclier', checked: allowBoosts, onChange: setAllowBoosts },
                  { label: 'Sabotages activés', desc: 'Les joueurs peuvent se nuire mutuellement', checked: allowSabotage, onChange: setAllowSabotage },
                ].map(opt => (
                  <label
                    key={opt.label}
                    className="flex items-center justify-between rounded px-4 py-3 cursor-pointer transition"
                    style={{ background:'#0e0c08', border:'1px solid #2a2218' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#6b5010')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2218')}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color:'#f0dfa8' }}>{opt.label}</p>
                      <p className="text-xs" style={{ color:'#6b5010' }}>{opt.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={opt.checked}
                      onChange={e => opt.onChange(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: '#c8880c' }}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP: review */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="rounded p-4" style={{ background:'#0e0c08', border:'1px solid #3a2d10' }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color:'#6b5010', fontFamily:'"Cinzel", serif' }}>Prophétie</p>
                <p className="font-semibold" style={{ color:'#f0dfa8', fontFamily:'"Lora", serif', fontStyle:'italic' }}>« {question} »</p>
                {context && <p className="text-sm mt-2" style={{ color:'#6b5010' }}>{context}</p>}
              </div>

              <div className="rounded p-4" style={{ background:'#0e0c08', border:'1px solid #3a2d10' }}>
                <p className="text-xs uppercase tracking-wide mb-3" style={{ color:'#6b5010', fontFamily:'"Cinzel", serif' }}>Les possibles</p>
                <div className="space-y-2">
                  {options.filter(o => o.label.trim()).map((o, i) => (
                    <div key={o.id} className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                        style={{ background:'#1e1810', border:'1px solid #c8880c', color:'#c8880c', fontFamily:'"Cinzel", serif' }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm" style={{ color:'#f0dfa8' }}>{o.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded p-3" style={{ background:'#0e0c08', border:'1px solid #3a2d10' }}>
                  <p className="text-xs mb-1" style={{ color:'#6b5010' }}>Votes ferment</p>
                  <p style={{ color:'#f0dfa8', fontSize:'0.8rem' }}>{voteDeadline ? new Date(voteDeadline).toLocaleString('fr-FR') : '-'}</p>
                </div>
                <div className="rounded p-3" style={{ background:'#0e0c08', border:'1px solid #3a2d10' }}>
                  <p className="text-xs mb-1" style={{ color:'#6b5010' }}>Récompense</p>
                  <p className="font-bold" style={{ color:'#f5c842', fontFamily:'"Cinzel", serif' }}>{baseReward} pts</p>
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                {allowBoosts && (
                  <span className="px-3 py-1 rounded-full" style={{ background:'#0e0c08', border:'1px solid #3a2d10', color:'#6b5010' }}>
                    Boosts activés
                  </span>
                )}
                {allowSabotage && (
                  <span className="px-3 py-1 rounded-full" style={{ background:'#0e0c08', border:'1px solid #3a2d10', color:'#6b5010' }}>
                    Sabotages activés
                  </span>
                )}
              </div>

              {error && (
                <div className="rounded px-4 py-3 text-sm" style={{ background:'#2a0c0c', border:'1px solid #6b2020', color:'#e05050' }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="px-5 py-2.5 rounded text-sm font-medium transition"
            style={{
              border:'1px solid #3a2d10',
              color: stepIndex === 0 ? '#2a1810' : '#6b5010',
              fontFamily:'"Cinzel", serif',
              fontSize:'0.75rem',
              cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
              background:'transparent',
            }}
            onMouseEnter={e => { if (stepIndex > 0) { (e.currentTarget as HTMLElement).style.borderColor='#6b5010'; (e.currentTarget as HTMLElement).style.color='#c8880c' }}}
            onMouseLeave={e => { if (stepIndex > 0) { (e.currentTarget as HTMLElement).style.borderColor='#3a2d10'; (e.currentTarget as HTMLElement).style.color='#6b5010' }}}
          >
            ← Précédent
          </button>

          {step !== 'review' ? (
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className="px-6 py-2.5 rounded text-sm font-semibold transition"
              style={{
                background: canGoNext() ? 'linear-gradient(135deg, #a36808, #c8880c)' : '#2a2218',
                color: canGoNext() ? '#0e0c08' : '#3a2d10',
                fontFamily:'"Cinzel", serif',
                fontSize:'0.75rem',
                border: `1px solid ${canGoNext() ? '#f5c842' : '#3a2d10'}`,
                cursor: canGoNext() ? 'pointer' : 'not-allowed',
                letterSpacing:'0.06em',
              }}
            >
              Suivant →
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
                className="px-5 py-2.5 rounded text-sm font-medium transition"
                style={{ border:'1px solid #3a2d10', color:'#6b5010', fontFamily:'"Cinzel", serif', fontSize:'0.7rem', background:'transparent' }}
              >
                Brouillon
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
                className="px-6 py-2.5 rounded text-sm font-semibold transition flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
                  color:'#0e0c08',
                  fontFamily:'"Cinzel", serif',
                  fontSize:'0.75rem',
                  border:'1px solid #f5c842',
                  letterSpacing:'0.06em',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow:'0 0 20px #c8880c40',
                }}
              >
                {isLoading && (
                  <span className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor:'#0e0c08', borderTopColor:'transparent' }} />
                )}
                {isLoading ? 'Invocation...' : '✦ Sceller et Partager'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
