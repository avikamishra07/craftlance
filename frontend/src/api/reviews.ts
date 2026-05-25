import { api } from './client'
import type { Review, Reputation, ReviewCreatePayload } from '@/types'

export const reviewsApi = {
  /** Submit a review for a completed contract */
  submit: async (contractId: string, payload: ReviewCreatePayload): Promise<Review> => {
    const { data } = await api.post<Review>(`/contracts/${contractId}/review`, payload)
    return data
  },

  /** Has the current user already reviewed this contract? */
  status: async (contractId: string): Promise<{ has_reviewed: boolean }> => {
    const { data } = await api.get<{ has_reviewed: boolean }>(
      `/contracts/${contractId}/review/status`
    )
    return data
  },

  /** Reviews received by a user */
  forUser: async (userId: string, page = 1, pageSize = 10): Promise<Review[]> => {
    const { data } = await api.get<Review[]>(`/users/${userId}/reviews`, {
      params: { page, page_size: pageSize },
    })
    return data
  },

  /** Reputation breakdown for a user */
  reputation: async (userId: string): Promise<Reputation> => {
    const { data } = await api.get<Reputation>(`/users/${userId}/reputation`)
    return data
  },

  /** Reviews the current user has written */
  mine: async (): Promise<Review[]> => {
    const { data } = await api.get<Review[]>('/reviews/mine')
    return data
  },
}
