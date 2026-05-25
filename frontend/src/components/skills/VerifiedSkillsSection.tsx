/**
 * VerifiedSkillsSection.tsx — M8
 *
 * Drop this into FreelancerProfile to show a user's skills with verified
 * badges alongside unverified ones.
 *
 * Usage in FreelancerProfile.tsx:
 *
 *   import { VerifiedSkillsSection } from '@/components/skills/VerifiedSkillsSection'
 *
 *   // Replace the existing skills list with:
 *   <VerifiedSkillsSection
 *     skills={user.skills}          // string[] of skill names
 *     verifications={verifications} // VerifiedSkillOut[] from GET /skills/verified
 *   />
 *
 * The component matches skills by lower-cased key, so "React" matches key "react".
 */
import { cn } from '@/lib/utils'
import { VerifiedBadge } from './VerifiedBadge'
import type { VerifiedSkillOut } from '@/api/skills'

interface VerifiedSkillsSectionProps {
  skills:         string[]            // raw skills array from user profile
  verifications:  VerifiedSkillOut[]  // from skillStore.verified
  className?:     string
}

export function VerifiedSkillsSection({ skills, verifications, className }: VerifiedSkillsSectionProps) {
  // Build a map: skill_key → best badge
  const badgeMap = verifications.reduce<Record<string, 'bronze' | 'silver' | 'gold'>>((acc, v) => {
    if (!v.badge_level) return acc
    const rank = { bronze: 1, silver: 2, gold: 3 }
    const current = acc[v.skill_key]
    if (!current || rank[v.badge_level] > rank[current]) {
      acc[v.skill_key] = v.badge_level
    }
    return acc
  }, {})

  if (!skills.length) return null

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Skills</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map(skill => {
          const key   = skill.toLowerCase().replace(/[.\s]+/g, '')
          const badge = badgeMap[key] ?? null
          return (
            <div
              key={skill}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                badge
                  ? 'border-brand-500/30 bg-brand-500/8 text-foreground'
                  : 'border-white/10 bg-white/5 text-foreground/70',
              )}
            >
              <span>{skill}</span>
              {badge && <VerifiedBadge level={badge} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
