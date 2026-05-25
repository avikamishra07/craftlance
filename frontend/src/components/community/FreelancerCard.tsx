/**
 * FreelancerCard.tsx — M9
 * Freelancer card for the community directory grid.
 * Shows avatar, title, skills, rate, reputation, verified badge, save button.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Star, CheckCircle2, Clock, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VerifiedBadge } from '@/components/skills/VerifiedBadge'
import type { FreelancerCard as FreelancerCardType } from '@/api/community'

const AVAILABILITY_LABEL: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract:  'Contract',
}

interface FreelancerCardProps {
  freelancer:  FreelancerCardType
  onToggleSave: (id: string) => void
  saving?:     boolean
}

export function FreelancerCard({ freelancer, onToggleSave, saving }: FreelancerCardProps) {
  const [hover, setHover] = useState(false)
  const f = freelancer

  // Best badge across verified skills
  const RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3 }
  const topBadge = f.verified_skills.reduce<'bronze' | 'silver' | 'gold' | null>((best, vs) => {
    if (!vs.badge_level) return best
    if (!best) return vs.badge_level
    return RANK[vs.badge_level] > RANK[best] ? vs.badge_level : best
  }, null)

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface-1 flex flex-col overflow-hidden transition-all duration-200',
        hover ? 'border-white/15 shadow-lg shadow-black/20' : 'border-white/8',
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Header */}
      <div className="p-5 flex gap-4">
        {/* Avatar */}
        <Link to={`/profile/${f.id}`} className="shrink-0">
          {f.avatar_url ? (
            <img
              src={f.avatar_url}
              alt={f.full_name ?? f.username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-300 font-bold text-lg">
              {(f.full_name ?? f.username).charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        {/* Name / title / badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/profile/${f.id}`}
                className="font-semibold text-sm hover:text-brand-300 transition-colors line-clamp-1"
              >
                {f.full_name ?? f.username}
              </Link>
              {f.title && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{f.title}</p>
              )}
            </div>
            {/* Save button */}
            <button
              onClick={() => onToggleSave(f.id)}
              disabled={saving}
              className={cn(
                'shrink-0 p-1.5 rounded-lg transition-colors',
                f.is_saved
                  ? 'text-brand-400 bg-brand-500/15 hover:bg-brand-500/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/8',
              )}
              title={f.is_saved ? 'Unsave' : 'Save'}
            >
              {f.is_saved
                ? <BookmarkCheck size={15} />
                : <Bookmark size={15} />}
            </button>
          </div>

          {/* Verified + availability */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {f.is_verified && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5 font-medium">
                <CheckCircle2 size={10} />
                Verified
              </span>
            )}
            {topBadge && (
              <VerifiedBadge level={topBadge} size="sm" />
            )}
            {f.availability && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-white/5 rounded-full px-2 py-0.5">
                <Clock size={9} />
                {AVAILABILITY_LABEL[f.availability] ?? f.availability}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {f.bio && (
        <p className="px-5 text-xs text-muted-foreground line-clamp-2 -mt-1">{f.bio}</p>
      )}

      {/* Skills */}
      {f.skills.length > 0 && (
        <div className="px-5 mt-3 flex flex-wrap gap-1.5">
          {f.skills.slice(0, 5).map(s => (
            <span
              key={s}
              className="text-[11px] bg-white/6 border border-white/8 rounded-full px-2 py-0.5 text-muted-foreground"
            >
              {s}
            </span>
          ))}
          {f.skills.length > 5 && (
            <span className="text-[11px] text-muted-foreground">+{f.skills.length - 5}</span>
          )}
        </div>
      )}

      {/* Stats footer */}
      <div className="mt-auto px-5 py-3.5 border-t border-white/6 flex items-center gap-4 text-xs text-muted-foreground">
        {f.hourly_rate != null && (
          <span className="font-semibold text-foreground">
            ${f.hourly_rate.toFixed(0)}<span className="font-normal text-muted-foreground">/hr</span>
          </span>
        )}
        {f.reputation_score != null && (
          <span className="flex items-center gap-1">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            {f.reputation_score.toFixed(1)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Briefcase size={11} />
          {f.completed_jobs} job{f.completed_jobs !== 1 ? 's' : ''}
        </span>
        {f.verified_skills.length > 0 && (
          <span className="ml-auto text-[11px] text-brand-400">
            {f.verified_skills.length} verified skill{f.verified_skills.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
