import api from './api'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types'

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', data)
    return res.data
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', data)
    return res.data
  },

  async me(): Promise<AuthResponse['user']> {
    const res = await api.get('/auth/me')
    return res.data
  },

  logout() {
    localStorage.removeItem('token')
  },

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string; expiresAt?: string }> {
    const res = await api.post<{ message: string; resetToken?: string; expiresAt?: string }>('/auth/forgot-password', { email })
    return res.data
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword })
    return res.data
  },
}
