import api from './api'
import type { Prediction, VoteApiResponse } from '../types'

export const predictionService = {
  async getByShareCode(shareCode: string): Promise<Prediction> {
    const res = await api.get<Prediction>(`/predictions/share/${shareCode}`)
    return res.data
  },

  async getById(id: string): Promise<Prediction> {
    const res = await api.get<Prediction>(`/predictions/${id}`)
    return res.data
  },

  async create(data: Partial<Prediction>): Promise<Prediction> {
    const res = await api.post<Prediction>('/predictions', data)
    return res.data
  },

  async publish(id: string): Promise<Prediction> {
    const res = await api.post<Prediction>(`/predictions/${id}/publish`)
    return res.data
  },

  async resolve(id: string, correctOptionId: string): Promise<Prediction> {
    const res = await api.post<Prediction>(`/predictions/${id}/resolve`, { correctOptionId })
    return res.data
  },

  async vote(predictionId: string, optionId: string, secondOptionId?: string): Promise<VoteApiResponse> {
    const res = await api.post<VoteApiResponse>(`/predictions/${predictionId}/vote`, {
      optionId,
      ...(secondOptionId ? { secondOptionId } : {}),
    })
    return res.data
  },

  async getMyPredictions(): Promise<Prediction[]> {
    const res = await api.get<Prediction[]>('/predictions/me')
    return res.data
  },

  async getVoters(predictionId: string): Promise<{ userId: string; userName: string }[]> {
    const res = await api.get(`/predictions/${predictionId}/voters`)
    return res.data
  },
}
