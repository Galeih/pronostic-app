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
}
