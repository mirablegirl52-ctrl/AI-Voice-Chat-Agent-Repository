import { create } from 'zustand'

interface AuthUser {
  id: string
  name: string
  email: string
  plan: string
  voicePreference?: string
  personality?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('aria_token'),
  user: localStorage.getItem('aria_user') ? JSON.parse(localStorage.getItem('aria_user')!) : null,
  setAuth: (token, user) => {
    localStorage.setItem('aria_token', token)
    localStorage.setItem('aria_user', JSON.stringify(user))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('aria_token')
    localStorage.removeItem('aria_user')
    set({ token: null, user: null })
  },
  loadFromStorage: () => {
    const token = localStorage.getItem('aria_token')
    const user = localStorage.getItem('aria_user')
    set({ token, user: user ? JSON.parse(user) : null })
  },
}))
