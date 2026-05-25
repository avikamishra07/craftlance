import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginPayload, RegisterPayload } from '@/types'
import { authApi } from '@/api/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  updateUser: (user: User) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (payload) => {
        set({ isLoading: true, error: null })
        try {
          const tokens = await authApi.login(payload)
          localStorage.setItem('access_token', tokens.access_token)
          localStorage.setItem('refresh_token', tokens.refresh_token)
          const user = await authApi.me()
          set({
            user,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (err: any) {
          set({
            error: err.response?.data?.detail || 'Login failed',
            isLoading: false,
          })
          throw err
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null })
        try {
          const tokens = await authApi.register(payload)
          localStorage.setItem('access_token', tokens.access_token)
          localStorage.setItem('refresh_token', tokens.refresh_token)
          const user = await authApi.me()
          set({
            user,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (err: any) {
          set({
            error: err.response?.data?.detail || 'Registration failed',
            isLoading: false,
          })
          throw err
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        })
      },

      fetchMe: async () => {
        try {
          const user = await authApi.me()
          set({ user, isAuthenticated: true })
        } catch {
          get().logout()
        }
      },

      updateUser: (user: User) => set({ user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'craftlance-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
