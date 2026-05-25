/**
 * api/skills.ts — M8
 * All skill verification API calls.
 */
import { api } from './client'

export interface SkillCatalogueItem {
  key:            string
  label:          string
  icon:           string
  description:    string
  question_count: number
}

export interface QuestionOut {
  index:   number
  text:    string
  options: string[]
}

export interface TestStartResponse {
  test_id:          string
  skill_key:        string
  skill_label:      string
  questions:        QuestionOut[]
  duration_seconds: number
  started_at:       number
}

export interface TestSubmitRequest {
  answers: Record<string, number>  // "0" → chosen option index
}

export interface TestSubmitResponse {
  verification_id: string
  skill_key:       string
  skill_label:     string
  score_pct:       number
  correct:         number
  total:           number
  badge:           'bronze' | 'silver' | 'gold' | null
  time_taken_s:    number | null
  completed_at:    string
}

export interface VerifiedSkillOut {
  id:           string
  skill_key:    string
  skill_label:  string
  score_pct:    number
  badge_level:  'bronze' | 'silver' | 'gold' | null
  completed_at: string | null
}

export const skillsApi = {
  listTests: (): Promise<SkillCatalogueItem[]> =>
    api.get('/skills/tests').then(r => r.data),

  startTest: (skillKey: string): Promise<TestStartResponse> =>
    api.post(`/skills/tests/${skillKey}/start`).then(r => r.data),

  submitTest: (testId: string, payload: TestSubmitRequest): Promise<TestSubmitResponse> =>
    api.post(`/skills/tests/${testId}/submit`, payload).then(r => r.data),

  getVerified: (): Promise<VerifiedSkillOut[]> =>
    api.get('/skills/verified').then(r => r.data),
}
