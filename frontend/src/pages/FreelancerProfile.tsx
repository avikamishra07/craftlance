/**
 * FreelancerProfile.tsx — M9 misc fix
 *
 * All mock data replaced with real API calls:
 *   GET /users/:userId          — profile
 *   GET /users/:userId/portfolio
 *   GET /users/:userId/reviews
 *   GET /users/:userId/reputation
 *   GET /users/:userId/verified-skills  (M9 new endpoint)
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Star, MapPin, Clock, Briefcase, CheckCircle2,
  ExternalLink, Loader2, AlertCircle,
} from 'lucide-react'
import { api } from '@/api/client'
import { communityApi } from '@/api/community'
import { VerifiedBadge } from '@/components/skills/VerifiedBadge'
import { VerifiedSkillsSection } from '@/components/skills/VerifiedSkillsSection'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { VerifiedSkillPublic } from '@/api/community'

interface UserProfile {
  id:           string
  username:     string
  full_name:    string | null
  avatar_url:   string | null
  title:        string | null
  bio:          string | null
  skills:       string[]
  hourly_rate:  number | null
  availability: string | null
  is_verified:  boolean
  location:     string | null
  member_since: string
}

interface PortfolioItem {
  id:          string
  title:       string
  description: string | null
  url:         string | null
  image_url:   string | null
  created_at:  string
}

interface Review {
  id:           string
  reviewer_id:  string
  reviewer_name: string
  reviewer_avatar: string | null
  rating:       number
  comment:      string
  created_at:   string
}

interface Reputation {
  score:          number
  completed_jobs: number
  on_time_rate:   number | null
  response_rate:  number | null
}

export default function FreelancerProfile() {
  const { userId } = useParams<{ userId: string }>()

  const [profile,    setProfile]    = useState<UserProfile | null>(null)
  const [portfolio,  setPortfolio]  = useState<PortfolioItem[]>([])
  const [reviews,    setReviews]    = useState<Review[]>([])
  const [reputation, setReputation] = useState<Reputation | null>(null)
  const [verified,   setVerified]   = useState<VerifiedSkillPublic[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)

    Promise.all([
      api.get(`/users/${userId}`).then(r => r.data),
      api.get(`/users/${userId}/portfolio`).then(r => r.data).catch(() => []),
      api.get(`/users/${userId}/reviews`).then(r => r.data).catch(() => []),
      api.get(`/users/${userId}/reputation`).then(r => r.data).catch(() => null),
      communityApi.getUserVerifiedSkills(userId).catch(() => []),
    ])
      .then(([prof, port, revs, rep, vs]) => {
        setProfile(prof)
        setPortfolio(Array.isArray(port) ? port : port.items ?? [])
        setReviews(Array.isArray(revs) ? revs : revs.reviews ?? [])
        setReputation(rep)
        setVerified(vs)
      })
      .catch(e => setError(e?.response?.data?.detail ?? 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex justify-center">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-muted-foreground space-y-3">
        <AlertCircle size={36} className="mx-auto opacity-40" />
        <p className="text-sm">{error ?? 'Profile not found.'}</p>
        <Link to="/community" className="text-brand-400 text-sm hover:underline">
          ← Back to community
        </Link>
      </div>
    )
  }

  const RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3 }
  const topBadge = verified.reduce<'bronze' | 'silver' | 'gold' | null>((best, vs) => {
    if (!vs.badge_level) return best
    if (!best) return vs.badge_level as any
    return RANK[vs.badge_level] > RANK[best] ? vs.badge_level as any : best
  }, null)

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header card */}
      <div className="rounded-2xl border border-white/8 bg-surface-1 p-6 flex gap-6">
        {/* Avatar */}
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name ?? profile.username}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10 shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-300 font-bold text-3xl shrink-0">
            {(profile.full_name ?? profile.username).charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold">{profile.full_name ?? profile.username}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
            <div className="flex gap-1.5 flex-wrap mt-0.5">
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-1 font-medium">
                  <CheckCircle2 size={11} /> Verified
                </span>
              )}
              {topBadge && <VerifiedBadge level={topBadge} size="md" />}
            </div>
          </div>

          {profile.title && (
            <p className="mt-1.5 text-sm font-medium">{profile.title}</p>
          )}
          {profile.bio && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {profile.bio}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {profile.hourly_rate != null && (
              <span className="font-semibold text-foreground text-sm">
                ${profile.hourly_rate}/hr
              </span>
            )}
            {reputation && (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                {reputation.score.toFixed(1)} · {reputation.completed_jobs} jobs
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {profile.location}
              </span>
            )}
            {profile.availability && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {profile.availability === 'full_time' ? 'Full-time'
                  : profile.availability === 'part_time' ? 'Part-time'
                  : 'Contract'}
              </span>
            )}
            <span>Member since {new Date(profile.member_since).getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {reputation && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Reputation',   value: reputation.score.toFixed(1) + ' ★' },
            { label: 'Jobs done',    value: reputation.completed_jobs },
            { label: 'On-time rate', value: reputation.on_time_rate != null ? reputation.on_time_rate.toFixed(0) + '%' : '—' },
            { label: 'Response',     value: reputation.response_rate != null ? reputation.response_rate.toFixed(0) + '%' : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-surface-1 p-4 text-center">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Verified skills */}
      {(profile.skills.length > 0 || verified.length > 0) && (
        <section>
          <h2 className="text-base font-semibold mb-3">Skills</h2>
          <VerifiedSkillsSection skills={profile.skills} verifications={verified as any} />
        </section>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Portfolio</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {portfolio.map(item => (
              <div key={item.id} className="rounded-xl border border-white/8 bg-surface-1 overflow-hidden group">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-36 object-cover group-hover:opacity-90 transition-opacity"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-brand-400 transition-colors shrink-0">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Reviews ({reviews.length})</h2>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-xl border border-white/8 bg-surface-1 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  {r.reviewer_avatar ? (
                    <img src={r.reviewer_avatar} alt={r.reviewer_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                      {r.reviewer_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.reviewer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={cn(
                          i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15',
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
