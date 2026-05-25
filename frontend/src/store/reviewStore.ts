import { create } from 'zustand'
import type { Review, Reputation } from '@/types'
import { reviewsApi } from '@/api/reviews'

interface ReviewStore {
  // Reviews by reviewee userId
  reviewsByUser: Record<string, Review[]>
  reviewsLoading: Record<string, boolean>
  fetchUserReviews: (userId: string) => Promise<void>

  // Reputation by userId
  reputationByUser: Record<string, Reputation>
  reputationLoading: Record<string, boolean>
  fetchReputation: (userId: string) => Promise<void>

  // Reviews I've written
  myReviews: Review[]
  myReviewsLoading: boolean
  fetchMyReviews: () => Promise<void>

  // Reviewed contract ids (to show/hide LeaveReview modal)
  reviewedContracts: Set<string>
  checkReviewStatus: (contractId: string) => Promise<boolean>
  markReviewed: (contractId: string) => void

  // Submit
  submit: (contractId: string, payload: import('@/types').ReviewCreatePayload) => Promise<Review>
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  // ── User reviews ───────────────────────────────────────────────────────────
  reviewsByUser: {},
  reviewsLoading: {},

  fetchUserReviews: async (userId) => {
    set((s) => ({ reviewsLoading: { ...s.reviewsLoading, [userId]: true } }))
    try {
      const reviews = await reviewsApi.forUser(userId)
      set((s) => ({
        reviewsByUser: { ...s.reviewsByUser, [userId]: reviews },
        reviewsLoading: { ...s.reviewsLoading, [userId]: false },
      }))
    } catch {
      set((s) => ({ reviewsLoading: { ...s.reviewsLoading, [userId]: false } }))
    }
  },

  // ── Reputation ─────────────────────────────────────────────────────────────
  reputationByUser: {},
  reputationLoading: {},

  fetchReputation: async (userId) => {
    set((s) => ({ reputationLoading: { ...s.reputationLoading, [userId]: true } }))
    try {
      const rep = await reviewsApi.reputation(userId)
      set((s) => ({
        reputationByUser: { ...s.reputationByUser, [userId]: rep },
        reputationLoading: { ...s.reputationLoading, [userId]: false },
      }))
    } catch {
      set((s) => ({ reputationLoading: { ...s.reputationLoading, [userId]: false } }))
    }
  },

  // ── My reviews ─────────────────────────────────────────────────────────────
  myReviews: [],
  myReviewsLoading: false,

  fetchMyReviews: async () => {
    set({ myReviewsLoading: true })
    try {
      const myReviews = await reviewsApi.mine()
      set({ myReviews, myReviewsLoading: false })
    } catch {
      set({ myReviewsLoading: false })
    }
  },

  // ── Review status ──────────────────────────────────────────────────────────
  reviewedContracts: new Set(),

  checkReviewStatus: async (contractId) => {
    const { has_reviewed } = await reviewsApi.status(contractId)
    if (has_reviewed) {
      set((s) => ({ reviewedContracts: new Set([...s.reviewedContracts, contractId]) }))
    }
    return has_reviewed
  },

  markReviewed: (contractId) =>
    set((s) => ({ reviewedContracts: new Set([...s.reviewedContracts, contractId]) })),

  // ── Submit ─────────────────────────────────────────────────────────────────
  submit: async (contractId, payload) => {
    const review = await reviewsApi.submit(contractId, payload)
    get().markReviewed(contractId)
    // Refresh my reviews list
    set((s) => ({ myReviews: [review, ...s.myReviews] }))
    return review
  },
}))
