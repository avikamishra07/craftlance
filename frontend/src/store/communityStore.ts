/**
 * communityStore.ts — M9
 * Zustand store for freelancer directory and saved freelancers.
 */
import { create } from 'zustand'
import {
  communityApi,
  FreelancerCard,
  FreelancerFilters,
} from '@/api/community'

interface CommunityState {
  // Directory
  freelancers:      FreelancerCard[]
  total:            number
  page:             number
  pages:            number
  loading:          boolean
  filters:          FreelancerFilters

  // Saved
  saved:            FreelancerCard[]
  savedLoading:     boolean

  // Actions
  setFilters:       (filters: FreelancerFilters) => void
  fetchDirectory:   (filters?: FreelancerFilters) => Promise<void>
  fetchNextPage:    () => Promise<void>
  fetchSaved:       () => Promise<void>
  toggleSave:       (id: string) => Promise<void>
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  freelancers:  [],
  total:        0,
  page:         1,
  pages:        1,
  loading:      false,
  filters:      {},
  saved:        [],
  savedLoading: false,

  setFilters: (filters) => set({ filters }),

  fetchDirectory: async (filters) => {
    const activeFilters = filters ?? get().filters
    set({ loading: true, filters: activeFilters, page: 1 })
    try {
      const res = await communityApi.listFreelancers({ ...activeFilters, page: 1 })
      set({
        freelancers: res.freelancers,
        total:       res.total,
        page:        res.page,
        pages:       res.pages,
      })
    } finally {
      set({ loading: false })
    }
  },

  fetchNextPage: async () => {
    const { page, pages, filters, freelancers } = get()
    if (page >= pages) return
    set({ loading: true })
    try {
      const res = await communityApi.listFreelancers({ ...filters, page: page + 1 })
      set({
        freelancers: [...freelancers, ...res.freelancers],
        page:        res.page,
        pages:       res.pages,
        total:       res.total,
      })
    } finally {
      set({ loading: false })
    }
  },

  fetchSaved: async () => {
    set({ savedLoading: true })
    try {
      const res = await communityApi.getSaved()
      set({ saved: res.freelancers })
    } finally {
      set({ savedLoading: false })
    }
  },

  toggleSave: async (id: string) => {
    const { freelancers, saved } = get()
    const isSaved = saved.some(f => f.id === id) ||
                    freelancers.find(f => f.id === id)?.is_saved

    // Optimistic update
    const patch = (cards: FreelancerCard[]) =>
      cards.map(f => f.id === id ? { ...f, is_saved: !isSaved } : f)

    set({
      freelancers: patch(freelancers),
      saved: isSaved
        ? saved.filter(f => f.id !== id)
        : saved,  // will refresh on next fetchSaved
    })

    try {
      if (isSaved) {
        await communityApi.unsaveFreelancer(id)
      } else {
        await communityApi.saveFreelancer(id)
      }
    } catch {
      // Rollback optimistic update on error
      set({
        freelancers: freelancers,
        saved:       saved,
      })
    }
  },
}))
