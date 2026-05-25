/**
 * skillStore.ts — M8
 * Zustand store for skill catalogue and verified skills.
 */
import { create } from 'zustand'
import { skillsApi, SkillCatalogueItem, VerifiedSkillOut } from '@/api/skills'

interface SkillState {
  catalogue:        SkillCatalogueItem[]
  catalogueLoading: boolean
  verified:         VerifiedSkillOut[]
  verifiedLoading:  boolean

  fetchCatalogue: () => Promise<void>
  fetchVerified:  () => Promise<void>
  addVerified:    (skill: VerifiedSkillOut) => void
}

export const useSkillStore = create<SkillState>((set, get) => ({
  catalogue:        [],
  catalogueLoading: false,
  verified:         [],
  verifiedLoading:  false,

  fetchCatalogue: async () => {
    if (get().catalogue.length) return   // already loaded
    set({ catalogueLoading: true })
    try {
      const data = await skillsApi.listTests()
      set({ catalogue: data })
    } finally {
      set({ catalogueLoading: false })
    }
  },

  fetchVerified: async () => {
    set({ verifiedLoading: true })
    try {
      const data = await skillsApi.getVerified()
      set({ verified: data })
    } finally {
      set({ verifiedLoading: false })
    }
  },

  addVerified: (skill) => {
    set(s => ({
      verified: [skill, ...s.verified.filter(v => v.skill_key !== skill.skill_key)],
    }))
  },
}))
