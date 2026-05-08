import api from './api'

export interface ProfileData {
  id: string
  userName: string
  email: string
  avatarUrl?: string
  level: number
  experience: number
  experienceForNextLevel: number
  totalPoints: number
  predictionsPlayed: number
  predictionsWon: number
  predictionsCreated: number
  winRate: number
  badges: BadgeSummary[]
  createdAt: string
  lastLoginAt?: string
}

export interface BadgeSummary {
  badgeId: string
  name: string
  description: string
  rarity: string
  iconUrl?: string
  unlockedAt: string
}

export interface HistoryItem {
  id: string
  question: string
  status: string
  shareCode: string
  createdAt: string
  resolvedAt?: string
  participantCount: number
  baseReward: number
  isCreator: boolean
  myVote?: {
    optionId: string
    optionLabel?: string
    secondOptionId?: string
    secondOptionLabel?: string
    isCorrect?: boolean
    rewardPoints: number
  }
}

export interface HistoryResponse {
  total: number
  page: number
  pageSize: number
  items: HistoryItem[]
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  avatarUrl?: string
  totalPoints: number
  level: number
  predictionsWon: number
  winRate: number
  isCurrentUser: boolean
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  myRank?: number
}

export const userService = {
  async getMyProfile(): Promise<ProfileData> {
    const res = await api.get<ProfileData>('/users/me/profile')
    return res.data
  },

  async getMyHistory(page = 1, pageSize = 20): Promise<HistoryResponse> {
    const res = await api.get<HistoryResponse>('/users/me/history', {
      params: { page, pageSize },
    })
    return res.data
  },

  async getLeaderboard(top = 50): Promise<LeaderboardResponse> {
    const res = await api.get<LeaderboardResponse>('/leaderboard', { params: { top } })
    return res.data
  },

  async updateProfile(userName: string): Promise<{ userName: string }> {
    const res = await api.put<{ userName: string }>('/users/me', { userName })
    return res.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/users/me/change-password', { currentPassword, newPassword })
  },
}
