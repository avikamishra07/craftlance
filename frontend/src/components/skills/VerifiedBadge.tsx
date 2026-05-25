/**
 * VerifiedBadge.tsx — M8
 * Compact badge chip shown on profile skill sections.
 */
import { cn } from '@/lib/utils'

type BadgeLevel = 'bronze' | 'silver' | 'gold'

interface VerifiedBadgeProps {
  level:      BadgeLevel
  label?:     string
  size?:      'sm' | 'md'
  className?: string
}

const BADGE_CONFIG: Record<BadgeLevel, { emoji: string; color: string; bg: string; border: string }> = {
  bronze: { emoji: '🥉', color: 'text-amber-600',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  silver: { emoji: '🥈', color: 'text-slate-300',  bg: 'bg-slate-400/10',  border: 'border-slate-400/30' },
  gold:   { emoji: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
}

export function VerifiedBadge({ level, label, size = 'sm', className }: VerifiedBadgeProps) {
  const cfg = BADGE_CONFIG[level]
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
      cfg.bg, cfg.border, cfg.color,
      className,
    )}>
      <span>{cfg.emoji}</span>
      {label && <span>{label}</span>}
    </span>
  )
}
