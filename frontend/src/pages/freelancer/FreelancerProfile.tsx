import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Globe, Github, Linkedin, Edit2, Plus,
  CheckCircle, Clock, MessageSquare, Star, Share2,
  Bookmark, ExternalLink,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/auth'
import { portfolioApi } from '@/api/portfolio'
import { ReputationCard } from '@/components/profile/ReputationCard'
import { SkillBadge, SkillList } from '@/components/profile/SkillBadge'
import { PortfolioCard } from '@/components/profile/PortfolioCard'
import { PortfolioModal } from '@/components/profile/PortfolioModal'
import { formatCurrency, getInitials, cn } from '@/lib/utils'
import type { User, PortfolioItem } from '@/types'

// Mock data used when real API not yet connected
const MOCK_USER: User = {
  id: 'mock-1',
  email: 'alex@example.com',
  full_name: 'Alex Johnson',
  role: 'freelancer',
  title: 'Full-Stack Engineer · React & Node.js',
  bio: 'I build fast, scalable web applications with 5+ years of experience. Specialize in React frontends, Node.js APIs, and PostgreSQL. Former engineer at Razorpay.',
  location: 'Mumbai, India',
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL', 'Figma'],
  hourly_rate: 65,
  availability: 'available',
  linkedin_url: 'https://linkedin.com',
  github_url: 'https://github.com',
  website_url: 'https://example.com',
  is_verified: true,
  onboarding_completed: true,
  identity_verified: true,
  reputation_score: 4.9,
  ontime_pct: 96,
  comm_score: 92,
  retention_pct: 78,
  completion_streak: 8,
  profile_completeness: 90,
  total_earnings: 48200,
  total_projects: 24,
  created_at: '2023-01-15T00:00:00Z',
}

const MOCK_PORTFOLIO: PortfolioItem[] = [
  {
    id: '1', user_id: 'mock-1', title: 'FinTrack Dashboard',
    description: 'Real-time financial analytics dashboard with D3 charts, custom alerts, and Plaid integration for 3 fintech startups.',
    tech_stack: ['React', 'D3.js', 'Node.js', 'PostgreSQL', 'Redis'],
    image_urls: [], live_url: 'https://example.com', github_url: 'https://github.com',
    category: 'Web App', outcomes: 'Used by 10k+ users, reduced report generation time by 70%',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2', user_id: 'mock-1', title: 'Craftlance API',
    description: 'High-performance REST API for a freelancing platform with JWT auth, role-based access, and milestone payment simulation.',
    tech_stack: ['FastAPI', 'PostgreSQL', 'SQLAlchemy', 'Redis', 'Docker'],
    image_urls: [], live_url: undefined, github_url: 'https://github.com',
    category: 'API / Backend', outcomes: 'Handles 50k req/day with <80ms p95 latency',
    created_at: '2024-03-01T00:00:00Z',
  },
  {
    id: '3', user_id: 'mock-1', title: 'Pulse Mobile App',
    description: 'React Native wellness tracking app with AI-powered habit suggestions and streak gamification.',
    tech_stack: ['React Native', 'Expo', 'TypeScript', 'Supabase'],
    image_urls: [], live_url: 'https://example.com', github_url: 'https://github.com',
    category: 'Mobile', outcomes: '4.8★ on App Store, 2k+ downloads in first month',
    created_at: '2024-05-01T00:00:00Z',
  },
]

const MOCK_REVIEWS = [
  { id: '1', reviewer: 'Sarah K.', role: 'CTO, FinScale', rating: 5, comment: 'Delivered ahead of schedule with incredible attention to detail. Alex took the time to understand our business needs.', initials: 'SK' },
  { id: '2', reviewer: 'Marcus W.', role: 'Founder, WebFlow', rating: 5, comment: 'Exceptional quality. The API he built handles our traffic flawlessly. Will definitely hire again.', initials: 'MW' },
]

export default function FreelancerProfile() {
  const { userId } = useParams()
  const { user: currentUser } = useAuthStore()
  const isOwn = !userId || userId === currentUser?.id

  const [user] = useState<User>(MOCK_USER)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(MOCK_PORTFOLIO)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews' | 'skills'>('portfolio')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)

  const handleSavePortfolio = async (data: any) => {
    if (editingItem) {
      setPortfolio((prev) => prev.map((p) => (p.id === editingItem.id ? { ...p, ...data } : p)))
    } else {
      const newItem: PortfolioItem = { id: Date.now().toString(), user_id: user.id, created_at: new Date().toISOString(), image_urls: [], ...data }
      setPortfolio((prev) => [newItem, ...prev])
    }
    setEditingItem(null)
  }

  const handleDelete = (id: string) => {
    setPortfolio((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="max-w-5xl">
      {/* Hero section */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-white/[0.06] p-6 mb-5"
      >
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center text-2xl font-bold text-white shadow-glow">
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-2xl object-cover" />
                : getInitials(user.full_name)
              }
            </div>
            {user.availability === 'available' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-surface-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{user.full_name}</h1>
                  {user.identity_verified && (
                    <span title="Identity verified" className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{user.title}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {user.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{user.location}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    {user.reputation_score.toFixed(1)} ({user.total_projects} projects)
                  </span>
                  <span className={cn('flex items-center gap-1', user.availability === 'available' ? 'text-green-400' : 'text-yellow-400')}>
                    <Clock className="h-3 w-3" />
                    {user.availability === 'available' ? 'Available now' : user.availability === 'busy' ? 'Busy' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {isOwn ? (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/[0.1] rounded-lg text-muted-foreground hover:text-foreground hover:border-white/[0.2] transition-all">
                    <Edit2 className="h-3 w-3" /> Edit profile
                  </button>
                ) : (
                  <>
                    <button className="p-2 rounded-lg border border-white/[0.1] text-muted-foreground hover:text-foreground hover:border-white/[0.2] transition-all">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg border border-white/[0.1] text-muted-foreground hover:text-foreground hover:border-white/[0.2] transition-all">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-xs bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-lg transition-all shadow-glow-sm">
                      <MessageSquare className="h-3 w-3" /> Hire Alex
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Rate + social links */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
              {user.hourly_rate && (
                <div>
                  <span className="text-lg font-bold text-brand-300">${user.hourly_rate}</span>
                  <span className="text-xs text-muted-foreground">/hr</span>
                </div>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {user.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                )}
                {user.github_url && (
                  <a href={user.github_url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
                  >
                    <Github className="h-3.5 w-3.5" />
                  </a>
                )}
                {user.website_url && (
                  <a href={user.website_url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          <ReputationCard user={user} />

          {/* Bio */}
          <div className="glass rounded-2xl border border-white/[0.06] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
          </div>

          {/* Skills */}
          <div className="glass rounded-2xl border border-white/[0.06] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Skills</h3>
            <SkillList skills={user.skills ?? []} />
          </div>

          {/* Quick stats */}
          <div className="glass rounded-2xl border border-white/[0.06] p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stats</h3>
            {[
              { label: 'Total earned', value: formatCurrency(user.total_earnings) },
              { label: 'Completed projects', value: user.total_projects },
              { label: 'Member since', value: new Date(user.created_at).getFullYear() },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-xl border border-white/[0.06] w-fit">
            {(['portfolio', 'reviews', 'skills'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-1.5 text-xs font-medium rounded-lg transition-all capitalize',
                  activeTab === tab
                    ? 'bg-brand-500 text-white shadow-glow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Portfolio tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              {isOwn && (
                <button
                  onClick={() => { setEditingItem(null); setModalOpen(true) }}
                  className="w-full py-3 border border-dashed border-white/[0.12] rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:border-brand-500/30 hover:bg-brand-500/5 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add project
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio.map((item, i) => (
                  <PortfolioCard key={item.id} item={item} index={i}
                    editable={isOwn}
                    onEdit={(item) => { setEditingItem(item); setModalOpen(true) }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              {portfolio.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No portfolio projects yet</p>
                </div>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {MOCK_REVIEWS.map((review, i) => (
                <motion.div key={review.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass rounded-2xl border border-white/[0.06] p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {review.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{review.reviewer}</p>
                          <p className="text-xs text-muted-foreground">{review.role}</p>
                        </div>
                        <div className="flex">
                          {[...Array(review.rating)].map((_, j) => (
                            <Star key={j} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">"{review.comment}"</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Skills tab */}
          {activeTab === 'skills' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass rounded-2xl border border-white/[0.06] p-5 space-y-4"
            >
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">All skills</h3>
                <SkillList skills={user.skills ?? []} />
              </div>
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-xs text-muted-foreground mb-3">Verified badges are earned through AI-generated skill tests.</p>
                <button className="flex items-center gap-2 px-4 py-2 text-xs bg-brand-500/10 border border-brand-500/30 text-brand-400 rounded-lg hover:bg-brand-500/20 transition-all">
                  Take a skill test
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <PortfolioModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null) }}
        onSave={handleSavePortfolio}
        editing={editingItem}
      />
    </div>
  )
}
