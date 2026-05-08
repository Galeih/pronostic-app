import api from './api'
import type { BoostCatalogItem, BoostUsageResponse } from '../types'

export const boostService = {
  /** Catalogue des boosts avec quantités possédées (requiert auth) */
  async getCatalog(): Promise<BoostCatalogItem[]> {
    const res = await api.get<BoostCatalogItem[]>('/boosts')
    return res.data
  },

  /**
   * Historique des boosts utilisés sur un pronostic.
   * Non-créateur avant résolution : retourne uniquement ses propres usages.
   * Après résolution : tout est révélé.
   */
  async getUsages(predictionId: string): Promise<BoostUsageResponse[]> {
    const res = await api.get<BoostUsageResponse[]>(`/predictions/${predictionId}/boosts`)
    return res.data
  },

  /** Utiliser le boost Correction (changer son vote) */
  async useCorrection(predictionId: string, newOptionId: string): Promise<{ message: string }> {
    const res = await api.post(`/predictions/${predictionId}/boosts/correction`, { newOptionId })
    return res.data
  },

  /** Utiliser le boost Sabotage contre un adversaire */
  async useSabotage(predictionId: string, targetUserId: string): Promise<{ message: string; wasBlocked: boolean }> {
    const res = await api.post(`/predictions/${predictionId}/boosts/sabotage`, { targetUserId })
    return res.data
  },

  /** Déployer un bouclier contre les sabotages */
  async useShield(predictionId: string): Promise<{ message: string; blockedSabotageCount: number }> {
    const res = await api.post(`/predictions/${predictionId}/boosts/shield`)
    return res.data
  },
}
