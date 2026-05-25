import { api } from './client'
import type { PortfolioItem, SkillVerification } from '@/types'

export interface CreatePortfolioPayload {
  title: string
  description: string
  tech_stack: string[]
  image_urls?: string[]
  live_url?: string
  github_url?: string
  category?: string
  outcomes?: string
}

export const portfolioApi = {
  list: (userId: string) =>
    api.get<PortfolioItem[]>(`/portfolio/${userId}`).then((r) => r.data),

  create: (payload: CreatePortfolioPayload) =>
    api.post<PortfolioItem>('/portfolio', payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreatePortfolioPayload>) =>
    api.patch<PortfolioItem>(`/portfolio/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/portfolio/${id}`).then((r) => r.data),
}

export const skillsApi = {
  listVerified: (userId: string) =>
    api.get<SkillVerification[]>(`/skills/verified/${userId}`).then((r) => r.data),

  startTest: (skill: string) =>
    api.post<{ questions: { q: string; options: string[] }[]; test_id: string }>(
      '/skills/test/start', { skill }
    ).then((r) => r.data),

  submitTest: (test_id: string, answers: number[]) =>
    api.post<SkillVerification>('/skills/test/submit', { test_id, answers }).then((r) => r.data),
}
