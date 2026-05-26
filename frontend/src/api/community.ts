/**
 * api/community.ts — M9
 * All community / freelancer directory API calls.
 */
import { api } from './client'

export interface VerifiedSkillPublic {
  skill_key:   string
  skill_label: string
  badge_level: 'bronze' | 'silver' | 'gold' | null
}

export interface FreelancerCard {
  id:               string
  full_name:        string        // always set — required on registration
  avatar_url:       string | null
  title:            string | null
  bio:              string | null
  skills:           string[]
  hourly_rate:      number | null
  availability:     string | null
  is_verified:      boolean
  reputation_score: number | null
  completed_jobs:   number
  verified_skills:  VerifiedSkillPublic[]
  is_saved:         boolean
}

export interface FreelancerDirectoryResponse {
  freelancers: FreelancerCard[]
  total:       number
  page:        number
  per_page:    number
  pages:       number
}

export interface SavedFreelancersResponse {
  freelancers: FreelancerCard[]
  total:       number
}

export interface FreelancerFilters {
  q?:             string
  skills?:        string         // comma-separated
  min_rate?:      number
  max_rate?:      number
  availability?:  string
  min_reputation?: number
  verified_only?: boolean
  page?:          number
  per_page?:      number
}

export const communityApi = {
  listFreelancers: (filters: FreelancerFilters = {}): Promise<FreelancerDirectoryResponse> => {
    const params: Record<string, string | number | boolean> = {}
    if (filters.q)             params.q             = filters.q
    if (filters.skills)        params.skills        = filters.skills
    if (filters.min_rate != null)  params.min_rate  = filters.min_rate
    if (filters.max_rate != null)  params.max_rate  = filters.max_rate
    if (filters.availability)  params.availability  = filters.availability
    if (filters.min_reputation != null) params.min_reputation = filters.min_reputation
    if (filters.verified_only) params.verified_only = true
    if (filters.page)          params.page          = filters.page
    if (filters.per_page)      params.per_page      = filters.per_page
    return api.get('/freelancers', { params }).then(r => r.data)
  },

  saveFreelancer: (id: string): Promise<void> =>
    api.post(`/freelancers/${id}/save`).then(() => undefined),

  unsaveFreelancer: (id: string): Promise<void> =>
    api.delete(`/freelancers/${id}/save`).then(() => undefined),

  getSaved: (): Promise<SavedFreelancersResponse> =>
    api.get('/freelancers/saved').then(r => r.data),

  getUserVerifiedSkills: (userId: string): Promise<VerifiedSkillPublic[]> =>
    api.get(`/users/${userId}/verified-skills`).then(r => r.data),
}
