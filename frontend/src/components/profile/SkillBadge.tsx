import { cn } from '@/lib/utils'
import type { BadgeLevel } from '@/types'
import { Award } from 'lucide-react'

interface SkillBadgeProps {
  skill: string
  level?: BadgeLevel
  verified?: boolean
  size?: 'sm' | 'md'
  onClick?: () => void
}

const levelConfig = {
  gold: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', icon: '🥇', label: 'Gold' },
  silver: { bg: 'bg-slate-400/10', border: 'border-slate-400/30', text: 'text-slate-300', icon: '🥈', label: 'Silver' },
  bronze: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', icon: '🥉', label: 'Bronze' },
}

export function SkillBadge({ skill, level, verified = false, size = 'md', onClick }: SkillBadgeProps) {
  const cfg = level ? levelConfig[level] : null

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        cfg
          ? cn(cfg.bg, cfg.border, cfg.text, onClick && 'hover:opacity-80')
          : 'bg-surface-2 border-white/[0.08] text-muted-foreground hover:border-white/[0.16] hover:text-foreground'
      )}
    >
      {cfg && <span>{cfg.icon}</span>}
      {!cfg && verified && <Award className="h-3 w-3 text-brand-400 shrink-0" />}
      {skill}
    </button>
  )
}

interface SkillListProps {
  skills: string[]
  verifications?: { skill: string; badge_level?: BadgeLevel; passed: boolean }[]
  editable?: boolean
  onRemove?: (skill: string) => void
  max?: number
}

export function SkillList({ skills, verifications = [], editable, onRemove, max }: SkillListProps) {
  const shown = max ? skills.slice(0, max) : skills
  const hidden = max ? skills.length - max : 0

  const getVerification = (skill: string) => verifications.find((v) => v.skill === skill && v.passed)

  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((skill) => {
        const v = getVerification(skill)
        return (
          <div key={skill} className="relative group">
            <SkillBadge skill={skill} level={v?.badge_level} verified={!!v} />
            {editable && onRemove && (
              <button
                onClick={() => onRemove(skill)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
      {hidden > 0 && (
        <span className="inline-flex items-center px-3 py-1 text-xs bg-surface-2 border border-white/[0.08] text-muted-foreground rounded-full">
          +{hidden} more
        </span>
      )}
    </div>
  )
}
