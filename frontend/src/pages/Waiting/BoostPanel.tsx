import { useState } from 'react'
import { boostService }      from '../../services/boostService'
import { predictionService } from '../../services/predictionService'
import { useToast }          from '../../context/ToastContext'
import type { BoostCatalogItem, Prediction, PredictionOption } from '../../types'

// ── Types ─────────────────────────────────────────────────────────────────────
type ActivePanel = 'none' | 'correction' | 'sabotage' | 'shield'
type Voter       = { userId: string; userName: string }

// ── Helpers ────────────────────────────────────────────────────────────────────
function qty(catalog: BoostCatalogItem[], type: string) {
  return catalog.find(b => b.boostType === type)?.ownedQuantity ?? 0
}

// ── Sous-composant : ligne de boost ───────────────────────────────────────────
function BoostRow({
  icon, name, desc, count, active, onClick,
}: {
  icon: string; name: string; desc: string
  count: number; active: boolean; onClick: () => void
}) {
  if (count === 0) return null
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded transition-all text-left"
      style={{
        background: active ? '#1e1810' : '#0e0c08',
        border:     `1px solid ${active ? '#c8880c' : '#3a2d10'}`,
        boxShadow:  active ? '0 0 12px #c8880c20' : 'none',
      }}
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: active ? '#f5c842' : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
          {name}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: '#6b5010' }}>{desc}</p>
      </div>
      <span
        className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: '#2a2218', color: '#c8880c', fontFamily: '"Cinzel", serif' }}
      >
        ×{count}
      </span>
    </button>
  )
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function BoostPanel({
  prediction,
  catalog,
  onCorrectionApplied,
  onBoostUsed,
}: {
  prediction: Prediction
  catalog: BoostCatalogItem[]
  onCorrectionApplied: () => void   // rafraîchit la prediction parente (correction)
  onBoostUsed: () => void           // rafraîchit catalog + usages (shield / sabotage)
}) {
  const { success, error: toastError } = useToast()

  const [active, setActive]             = useState<ActivePanel>('none')
  const [loading, setLoading]           = useState(false)

  // Correction
  const [corrOption, setCorrOption]     = useState<PredictionOption | null>(null)

  // Sabotage
  const [voters, setVoters]             = useState<Voter[]>([])
  const [votersLoaded, setVotersLoaded] = useState(false)
  const [sabTarget, setSabTarget]       = useState<Voter | null>(null)

  const currentOptionId = prediction.myVote?.optionId
  const options         = [...prediction.options].sort((a, b) => a.sortOrder - b.sortOrder)
  const otherOptions    = options.filter(o => o.id !== currentOptionId)

  const hasCorrectionBoost = qty(catalog, 'VoteCorrection') > 0
  const hasSabotageBoost   = qty(catalog, 'Sabotage') > 0
  const hasShieldBoost     = qty(catalog, 'Shield') > 0

  // Aucun boost utilisable → ne rien afficher
  if (!hasCorrectionBoost && !hasSabotageBoost && !hasShieldBoost) return null

  const setPanel = async (panel: ActivePanel) => {
    setCorrOption(null)
    setSabTarget(null)

    if (active === panel) { setActive('none'); return }
    setActive(panel)

    // Charger les votants pour le sabotage
    if (panel === 'sabotage' && !votersLoaded) {
      setLoading(true)
      try {
        const list = await predictionService.getVoters(prediction.id)
        setVoters(list)
        setVotersLoaded(true)
      } catch {
        toastError('Impossible de charger les adversaires.')
        setActive('none')
      } finally { setLoading(false) }
    }
  }

  const handleCorrection = async () => {
    if (!corrOption) return
    setLoading(true)
    try {
      const res = await boostService.useCorrection(prediction.id, corrOption.id)
      success(res.message)
      setActive('none')
      onCorrectionApplied()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toastError(msg ?? 'Erreur lors de la correction.')
    } finally { setLoading(false) }
  }

  const handleSabotage = async () => {
    if (!sabTarget) return
    setLoading(true)
    try {
      const res = await boostService.useSabotage(prediction.id, sabTarget.userId)
      res.wasBlocked ? toastError(res.message) : success(res.message)
      setActive('none')
      onBoostUsed()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toastError(msg ?? 'Erreur lors du sabotage.')
    } finally { setLoading(false) }
  }

  const handleShield = async () => {
    setLoading(true)
    try {
      const res = await boostService.useShield(prediction.id)
      success(res.message)
      setActive('none')
      onBoostUsed()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toastError(msg ?? 'Erreur lors du déploiement du bouclier.')
    } finally { setLoading(false) }
  }

  return (
    <div className="relative rounded mb-5" style={{ background: '#161209', border: '1px solid #6b5010' }}>

      {/* En-tête */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #2a2218' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
          ⚡ Tes pouvoirs
        </p>
      </div>

      {/* Liste des boosts */}
      <div className="px-4 py-3 space-y-2">
        {hasCorrectionBoost && (
          <BoostRow
            icon="🔄" name="Correction" active={active === 'correction'}
            desc="Modifie ton vote avant la fermeture"
            count={qty(catalog, 'VoteCorrection')}
            onClick={() => setPanel('correction')}
          />
        )}
        {hasSabotageBoost && prediction.allowSabotage && (
          <BoostRow
            icon="⚔" name="Sabotage" active={active === 'sabotage'}
            desc="Réduit les gains d'un adversaire de 20 %"
            count={qty(catalog, 'Sabotage')}
            onClick={() => setPanel('sabotage')}
          />
        )}
        {hasShieldBoost && (
          <BoostRow
            icon="🛡" name="Bouclier" active={active === 'shield'}
            desc="Protège contre le prochain sabotage"
            count={qty(catalog, 'Shield')}
            onClick={() => setPanel('shield')}
          />
        )}
      </div>

      {/* ── Panneau Correction ── */}
      {active === 'correction' && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid #2a2218', paddingTop: '12px' }}>
          <p className="text-xs mb-3" style={{ color: '#6b5010' }}>
            Choisis ta nouvelle réponse (différente de l'actuelle) :
          </p>
          <div className="space-y-2 mb-3">
            {otherOptions.map(opt => {
              const isSel = corrOption?.id === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setCorrOption(isSel ? null : opt)}
                  className="w-full text-left rounded px-4 py-3 transition-all flex items-center gap-3"
                  style={{
                    background: isSel ? '#1e1810' : '#0e0c08',
                    border: `1px solid ${isSel ? '#c8880c' : '#2a2218'}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: isSel ? '#c8880c' : '#3a2d10', background: isSel ? '#c8880c' : 'transparent' }}
                  >
                    {isSel && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0e0c08' }} />}
                  </div>
                  <span className="text-sm" style={{ color: isSel ? '#f5c842' : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
          <ActionButton
            label={corrOption ? `✦ Confirmer → « ${corrOption.label} »` : 'Sélectionne une option'}
            disabled={!corrOption || loading}
            loading={loading}
            color="amber"
            onClick={handleCorrection}
          />
        </div>
      )}

      {/* ── Panneau Sabotage ── */}
      {active === 'sabotage' && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid #2a2218', paddingTop: '12px' }}>
          {loading && !votersLoaded ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
            </div>
          ) : voters.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: '#6b5010' }}>
              Aucun adversaire n'a encore voté.
            </p>
          ) : (
            <>
              <p className="text-xs mb-3" style={{ color: '#6b5010' }}>
                Choisis ta cible :
              </p>
              <div className="space-y-2 mb-3">
                {voters.map(v => {
                  const isSel = sabTarget?.userId === v.userId
                  return (
                    <button
                      key={v.userId}
                      onClick={() => setSabTarget(isSel ? null : v)}
                      className="w-full text-left rounded px-4 py-3 transition-all flex items-center gap-3"
                      style={{
                        background: isSel ? '#2a0c0c' : '#0e0c08',
                        border: `1px solid ${isSel ? '#8b2020' : '#2a2218'}`,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: isSel ? '#6b2020' : '#2a2218', color: isSel ? '#ff8080' : '#6b5010' }}
                      >
                        {v.userName[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: isSel ? '#ff8080' : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                        {v.userName}
                      </span>
                      {isSel && <span className="ml-auto text-xs" style={{ color: '#8b2020' }}>⚔ Ciblé</span>}
                    </button>
                  )
                })}
              </div>
              <ActionButton
                label={sabTarget ? `⚔ Saboter « ${sabTarget.userName} »` : 'Sélectionne une cible'}
                disabled={!sabTarget || loading}
                loading={loading}
                color="red"
                onClick={handleSabotage}
              />
            </>
          )}
        </div>
      )}

      {/* ── Panneau Bouclier ── */}
      {active === 'shield' && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid #2a2218', paddingTop: '12px' }}>
          <p className="text-xs mb-4" style={{ color: '#6b5010' }}>
            Déploie ton bouclier pour bloquer le prochain sabotage reçu sur ce pronostic.
          </p>
          <ActionButton
            label="🛡 Déployer le bouclier"
            disabled={loading}
            loading={loading}
            color="blue"
            onClick={handleShield}
          />
        </div>
      )}

      {/* Les feedbacks passent maintenant par le système de toasts global */}
    </div>
  )
}

// ── Bouton d'action générique ─────────────────────────────────────────────────
function ActionButton({
  label, disabled, loading, color, onClick,
}: {
  label: string; disabled: boolean; loading: boolean
  color: 'amber' | 'red' | 'blue'; onClick: () => void
}) {
  const colors = {
    amber: { bg: 'linear-gradient(135deg, #a36808, #c8880c)', text: '#0e0c08', border: '#f5c842' },
    red:   { bg: 'linear-gradient(135deg, #6b0000, #8b2020)', text: '#ffaaaa', border: '#8b2020' },
    blue:  { bg: 'linear-gradient(135deg, #083060, #0a5090)', text: '#a0d0ff', border: '#2060a0' },
  }
  const c = colors[color]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full font-bold py-3 rounded text-sm transition flex items-center justify-center gap-2"
      style={{
        background:    disabled ? '#2a2218' : c.bg,
        color:         disabled ? '#3a2d10' : c.text,
        border:        `1px solid ${disabled ? '#2a2218' : c.border}`,
        fontFamily:    '"Cinzel", serif',
        fontSize:      '0.8rem',
        letterSpacing: '0.05em',
        cursor:        disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />}
      {label}
    </button>
  )
}
