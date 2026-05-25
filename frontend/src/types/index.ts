// ─────────────────────────────────────────────────────────────────────────────
// Craftlance — shared TypeScript types  (M1 + M2 + M3 + M4)
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────────────────────
export type UserRole           = 'freelancer' | 'client' | 'both'
export type AvailabilityStatus = 'available' | 'busy' | 'not_available'
export type ProjectStatus      = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'draft'
export type ProjectType        = 'fixed' | 'hourly'
export type ProposalStatus     = 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
export type ContractStatus     = 'active' | 'completed' | 'disputed' | 'cancelled' | 'paused'
export type MilestoneStatus    = 'pending' | 'in_progress' | 'submitted' | 'revision_requested' | 'approved' | 'paid'
export type PaymentStatus      = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
export type BadgeLevel         = 'bronze' | 'silver' | 'gold'

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  bio?: string
  title?: string
  location?: string
  skills?: string[]
  hourly_rate?: number
  availability: AvailabilityStatus
  linkedin_url?: string
  github_url?: string
  website_url?: string
  is_verified: boolean
  onboarding_completed: boolean
  identity_verified: boolean
  reputation_score: number
  ontime_pct: number
  comm_score: number
  retention_pct: number
  completion_streak: number
  profile_completeness: number
  total_earnings: number
  total_projects: number
  created_at: string
}

// ── Embedded summaries ────────────────────────────────────────────────────────
export interface UserBrief {
  id: string
  full_name: string
  avatar_url?: string
  is_verified: boolean
  reputation_score: number
}

export interface ClientSummary extends UserBrief {
  total_projects: number
}

export interface FreelancerSummary extends UserBrief {
  title?: string
  location?: string
  hourly_rate?: number
  total_projects: number
  skills?: string[]
}

export interface ProjectBrief {
  id: string
  title: string
  project_type: ProjectType
}

// ── Projects ──────────────────────────────────────────────────────────────────
export interface Project {
  id: string
  client_id: string
  title: string
  description: string
  required_skills: string[]
  budget_min: number
  budget_max: number
  deadline?: string
  project_type: ProjectType
  status: ProjectStatus
  views_count: number
  created_at: string
  updated_at: string
  client?: ClientSummary
  proposal_count?: number
}

// ── Proposals ─────────────────────────────────────────────────────────────────
export interface Proposal {
  id: string
  project_id: string
  freelancer_id: string
  bid_amount: number
  timeline_days: number
  cover_letter: string
  status: ProposalStatus
  ai_score?: number
  ai_clarity_score?: number
  ai_relevance_score?: number
  ai_professionalism_score?: number
  ai_value_score?: number
  ai_feedback?: string
  created_at: string
  updated_at: string
  freelancer?: FreelancerSummary
  project_title?: string
}

// ── Contracts ─────────────────────────────────────────────────────────────────
export interface Contract {
  id: string
  proposal_id: string
  project_id: string
  client_id: string
  freelancer_id: string
  total_amount: number
  platform_commission: number
  freelancer_amount: number
  status: ContractStatus
  started_at: string
  ended_at?: string
  created_at: string
  // Joined
  client?: UserBrief
  freelancer?: UserBrief
  project?: ProjectBrief
  milestone_count?: number
  completed_milestones?: number
  unread_messages?: number
}

// ── Milestones ────────────────────────────────────────────────────────────────
export interface Milestone {
  id: string
  contract_id: string
  title: string
  description?: string
  amount: number
  due_date?: string
  order_index: number
  status: MilestoneStatus
  deliverable_urls?: string[]
  revision_note?: string
  submitted_at?: string
  approved_at?: string
  created_at: string
}

// ── Messages ──────────────────────────────────────────────────────────────────
export interface Message {
  id: string
  contract_id: string
  sender_id: string
  content: string
  file_urls?: string[]
  is_read: boolean
  sent_at: string
  sender?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

// ── Portfolio + Skills ────────────────────────────────────────────────────────
export interface PortfolioItem {
  id: string
  user_id: string
  title: string
  description: string
  tech_stack: string[]
  image_urls: string[]
  live_url?: string
  github_url?: string
  category?: string
  outcomes?: string
  created_at: string
}

export interface SkillVerification {
  id: string
  user_id: string
  skill: string
  score: number
  passed: boolean
  badge_level?: BadgeLevel
  verified_at: string
}

// ── API payloads ──────────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RegisterPayload {
  email: string
  password: string
  full_name: string
  role: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}

export interface OnboardingPayload {
  title?: string
  bio?: string
  location?: string
  skills?: string[]
  hourly_rate?: number
  availability?: AvailabilityStatus
  linkedin_url?: string
  github_url?: string
  website_url?: string
}

export interface CreateProjectPayload {
  title: string
  description: string
  required_skills: string[]
  budget_min: number
  budget_max: number
  deadline?: string
  project_type: ProjectType
  status: ProjectStatus
}

export interface UpdateProjectPayload {
  title?: string
  description?: string
  required_skills?: string[]
  budget_min?: number
  budget_max?: number
  deadline?: string
  project_type?: ProjectType
  status?: ProjectStatus
}

export interface SubmitProposalPayload {
  bid_amount: number
  timeline_days: number
  cover_letter: string
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_next: boolean
  has_prev: boolean
}

// ── Errors ────────────────────────────────────────────────────────────────────
export interface ApiError {
  detail: string
  code?: string
}
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

