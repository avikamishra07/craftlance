// ─────────────────────────────────────────────────────────────────────────────
// Additions to types/index.ts for M6 — paste these into your existing file
// ─────────────────────────────────────────────────────────────────────────────

// ── Reviews (M6) ──────────────────────────────────────────────────────────────
export interface Review {
  id: string
  contract_id: string
  reviewer_id: string
  reviewee_id: string
  overall_rating: number
  communication_rating?: number
  quality_rating?: number
  ontime_rating?: number
  recommend_rating?: number
  body?: string
  created_at: string
  reviewer?: { id: string; full_name: string; avatar_url?: string }
  reviewee?: { id: string; full_name: string; avatar_url?: string }
}

export interface Reputation {
  user_id: string
  review_count: number
  avg_overall?: number
  avg_communication?: number
  avg_quality?: number
  avg_ontime?: number
  avg_recommend?: number
}

export interface ReviewCreatePayload {
  overall_rating: number
  communication_rating?: number
  quality_rating?: number
  ontime_rating?: number
  recommend_rating?: number
  body?: string
}
