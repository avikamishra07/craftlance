import { api } from './client'
import type { LoginPayload, RegisterPayload, TokenResponse, User, OnboardingPayload } from '@/types'

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<TokenResponse>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<TokenResponse>('/auth/login', payload).then((r) => r.data),

  refresh: (refresh_token: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token }).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
}

export const usersApi = {
  getMe: () => api.get<User>('/users/me').then((r) => r.data),

  updateProfile: (payload: Partial<User>) =>
    api.patch<User>('/users/me', payload).then((r) => r.data),

  completeOnboarding: (payload: OnboardingPayload) =>
    api.post<User>('/users/me/onboarding', payload).then((r) => r.data),

  getUser: (userId: string) =>
    api.get<User>(`/users/${userId}`).then((r) => r.data),

  listFreelancers: (params?: Record<string, string | number>) =>
    api.get<User[]>('/users', { params }).then((r) => r.data),
}
