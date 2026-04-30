import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { predictionService } from '../../services/predictionService'

interface OptionDraft {
  id: string
  label: string
  description: string
}

type Step = 'question' | 'options' | 'settings' | 'review'
const STEPS: Step[] = ['question', 'options', 'settings', 'review']
const STEP_LABELS: Record<Step, string> = {
  question: 'Question',
  options:  'Choix',
  settings: 'Parametres',
  review:   'Recapitulatif',
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

  const canGoNext = (): boolean => {
    if (step === 'question') return question.trim().length >= 5
    if (step === 'options')  return options.filter(o => o.label.trim()).length >= 2
    if (step === 'settings') return voteDeadline !== ''
    return true
  }

  const goNext = () => {
    if (!canGoNext()) return
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  const goPrev = () => {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  const addOption = () => {
    if (options.length >= 10) return
    setOptions(prev => [...prev, { id: crypto.randomUUID(), label: '', description: '' }])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) return
    setOptions(prev => prev.filter(o => o.id !== id))
  }

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
        allowBoosts,
        allowSabotage,
        baseReward,
      })

      if (publish) {
        const published = await predictionService.publish(prediction.id)
        navigate(`/p/${published.shareCode}`)
      } else {
        navigate(`/p/${prediction.shareCode}`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Une erreur est survenue.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="mb-8">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-300 text-sm mb-4 flex items-center gap-1">
            Retour
          </button>
          <h1 className="text-3xl font-extrabold">Creer un pronostic</h1>
          <p className="text-gray-400 text-sm mt-1">
            Pose une question, ajoute des choix, partage le lien.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${i <= stepIndex ? 'text-violet-400' : 'text-gray-600'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  i < stepIndex  ? 'bg-violet-600 border-violet-600 text-white' :
                  i === stepIndex ? 'border-violet-500 text-violet-400' :
                                   'border-gray-700 text-gray-600'
                }`}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{STEP_LABELS[s]}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded ${i < stepIndex ? 'bg-violet-600' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">

          {step === 'question' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Ta question <span className="text-violet-400">*</span>
                </label>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Qui va arriver en retard dimanche ?"
                  rows={3}
                  maxLength={500}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition"
                />
                <p className="text-xs text-gray-600 mt-1 text-right">{question.length}/500</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Contexte <span className="text-gray-500 font-normal">(facultatif)</span>
                </label>
                <textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Rendez-vous prevu a 14h devant la gare."
                  rows={2}
                  maxLength={1000}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition"
                />
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <p className="text-xs text-gray-500 mb-2 font-medium">Besoin d'inspiration ?</p>
                {[
                  "Combien de temps avant que Lucas dise je lag ?",
                  'Qui va finir son assiette en premier ?',
                  'Est-ce que le film va etre nul ?',
                ].map(ex => (
                  <button
                    key={ex}
                    onClick={() => setQuestion(ex)}
                    className="block text-xs text-gray-400 hover:text-violet-300 py-0.5 text-left transition"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'options' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-200 mb-1">
                  Choix de reponse <span className="text-violet-400">*</span>
                </p>
                <p className="text-xs text-gray-500 mb-4">Minimum 2 choix, maximum 10.</p>
              </div>

              {options.map((opt, index) => (
                <div key={opt.id} className="flex gap-3 items-start group">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-400 mt-2.5 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={e => updateOption(opt.id, 'label', e.target.value)}
                      placeholder={`Choix ${index + 1}`}
                      maxLength={200}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    />
                    <input
                      type="text"
                      value={opt.description}
                      onChange={e => updateOption(opt.id, 'description', e.target.value)}
                      placeholder="Description (facultatif)"
                      maxLength={300}
                      className="w-full bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg px-3 py-2 text-xs placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition"
                    />
                  </div>
                  <button
                    onClick={() => removeOption(opt.id)}
                    disabled={options.length <= 2}
                    className="mt-2.5 text-gray-600 hover:text-red-400 disabled:opacity-20 transition text-lg leading-none"
                  >
                    x
                  </button>
                </div>
              ))}

              {options.length < 10 && (
                <button
                  onClick={addOption}
                  className="w-full border-2 border-dashed border-gray-700 hover:border-violet-500/50 text-gray-500 hover:text-violet-400 rounded-lg py-3 text-sm transition flex items-center justify-center gap-2"
                >
                  + Ajouter un choix
                </button>
              )}
            </div>
          )}

          {step === 'settings' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Date limite de vote <span className="text-violet-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={voteDeadline}
                    onChange={e => setVoteDeadline(e.target.value)}
                    min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Date de revelation <span className="text-gray-500 font-normal">(facultatif)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={revealDate}
                    onChange={e => setRevealDate(e.target.value)}
                    min={voteDeadline || new Date().toISOString().slice(0, 16)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Recompense de base
                </label>
                <div className="flex gap-3 flex-wrap">
                  {[50, 100, 150, 250, 500].map(r => (
                    <button
                      key={r}
                      onClick={() => setBaseReward(r)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition border ${
                        baseReward === r
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-violet-500/50'
                      }`}
                    >
                      {r} pts
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold text-gray-200">Options de jeu</p>
                <label className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-800/70 transition">
                  <div>
                    <p className="text-sm text-white font-medium">Autoriser les boosts</p>
                    <p className="text-xs text-gray-500">Les joueurs peuvent utiliser correction, double vote...</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowBoosts}
                    onChange={e => setAllowBoosts(e.target.checked)}
                    className="w-5 h-5 accent-violet-500 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-800/70 transition">
                  <div>
                    <p className="text-sm text-white font-medium">Autoriser les sabotages</p>
                    <p className="text-xs text-gray-500">Les joueurs peuvent se saboter mutuellement.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowSabotage}
                    onChange={e => setAllowSabotage(e.target.checked)}
                    className="w-5 h-5 accent-violet-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-5">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Question</p>
                <p className="text-white font-semibold">{question}</p>
                {context && <p className="text-gray-400 text-sm mt-2 italic">{context}</p>}
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Choix de reponse</p>
                <div className="space-y-2">
                  {options.filter(o => o.label.trim()).map((o, i) => (
                    <div key={o.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-violet-900/50 border border-violet-700 flex items-center justify-center text-xs text-violet-300 font-bold">{i + 1}</span>
                      <span className="text-sm text-white">{o.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Votes fermes</p>
                  <p className="text-white font-medium">{voteDeadline ? new Date(voteDeadline).toLocaleString('fr-FR') : '-'}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Recompense</p>
                  <p className="text-violet-400 font-bold">{baseReward} pts</p>
                </div>
              </div>

              <div className="flex gap-2 text-xs text-gray-500">
                {allowBoosts && <span className="bg-gray-800 border border-gray-700 rounded-full px-3 py-1">Boosts actives</span>}
                {allowSabotage && <span className="bg-gray-800 border border-gray-700 rounded-full px-3 py-1">Sabotages actives</span>}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Precedent
          </button>

          {step !== 'review' ? (
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Suivant
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white disabled:opacity-40 transition"
              >
                Enregistrer en brouillon
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isLoading ? 'Publication...' : 'Publier et partager'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
