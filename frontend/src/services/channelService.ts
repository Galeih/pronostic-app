import api from './api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GroupMember {
  userId: string
  userName: string
  role: string
  level: number
  joinedAt: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderLevel: number
  content: string
  type: 'Text' | 'PredictionShare'
  predictionShareCode?: string
  createdAt: string
}

export interface Channel {
  id: string
  name: string
  description?: string
  inviteCode: string
  ownerId: string
  ownerName: string
  memberCount: number
  createdAt: string
  members: GroupMember[]
  lastMessage?: ChatMessage
}

// ── Service ───────────────────────────────────────────────────────────────────

export const channelService = {
  async create(name: string, description?: string): Promise<Channel> {
    const res = await api.post<Channel>('/groups', { name, description })
    return res.data
  },

  async join(inviteCode: string): Promise<Channel> {
    const res = await api.post<Channel>('/groups/join', { inviteCode })
    return res.data
  },

  async getAll(): Promise<Channel[]> {
    const res = await api.get<Channel[]>('/groups')
    return res.data
  },

  async getById(id: string): Promise<Channel> {
    const res = await api.get<Channel>(`/groups/${id}`)
    return res.data
  },

  async getMessages(groupId: string, before?: string, limit = 50): Promise<ChatMessage[]> {
    const params: Record<string, string | number> = { limit }
    if (before) params.before = before
    const res = await api.get<ChatMessage[]>(`/groups/${groupId}/messages`, { params })
    return res.data
  },

  async leave(id: string): Promise<void> {
    await api.delete(`/groups/${id}/leave`)
  },
}
