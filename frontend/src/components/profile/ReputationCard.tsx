import { motion } from 'framer-motion'
import { Shield, Zap, Clock, MessageSquare, RefreshCw, TrendingUp, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User, BadgeLevel } from '@/types'

interface ReputationCardProps {
  user: User
  compact?: boolean
}

function MetricRow({ icon: Icon, label, value, color, delay }: {
  icon: React.ElementType; label: string; value: number; color: string; delay: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className={cn('h-3 w-3', color)} />
          {label}
        </span>
        <span className="font-medium tabular-nums">{value}%</span>
      </div>
      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, delay, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color.replace('text-', 'bg-'))}
        />
      </div>
    </div>
  )
}

const BADGE_CONFIG: Record<BadgeLevel, { label: string; color: string; bg: string }> = {
  bronze: { label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  silver: { label: 'Silver', color: 'text-slate-300',  bg: 'bg-slate-300/10 border-slate-300/20' },
  gold:   { label: 'Gold',   color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
}

export function ReliabilityBadge({ level }: { level: BadgeLevel }) {
  const cfg = BADGE_CONFIG[level]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', cfg.bg, cfg.color)}>
      <Award className="h-3 w-3" />{cfg.label} Verified
    </span>
  )
}

export function SkillBadge({ skill, level, passed }: { skill: string; level?: BadgeLevel; passed?: boolean }) {
  if (!passed) {
    return (
      <span className="px-2.5 py-1 text-xs rounded-full bg-surface-3 border border-white/[0.06] text-muted-foreground">
        {skill}
      </span>
    )
  }
  const color = level === 'gold' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    : level === 'silver' ? 'text-slate-300 bg-slate-300/10 border-slate-300/20'
    : 'text-orange-400 bg-orange-400/10 border-orange-400/20'
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border font-medium', color)}>
      <Award className="h-3 w-3" />{skill}
    </span>
  )
}

export function ReputationCard({ user, compact = false }: ReputationCardProps) {
  const score = user.reputation_score || 4.9
  const scoreColor = score >= 4.5 ? 'text-green-400' : score >= 3.5 ? 'text-yellow-400' : 'text-red-400'

  const Stars = ({ size = 4 }: { size?: number }) => (
    <div className="flex">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={cn(`h-${size} w-${size}`, s <= Math.round(score) ? 'text-yellow-400' : 'text-surface-4')}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className={cn('text-lg font-bold tabular-nums', scoreColor)}>{score.toFixed(1)}</span>
        <div className="space-y-0.5">
          <Stars size={3} />
          <p className="text-xs text-muted-foreground">{user.total_projects} projects</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/[0.06] p-5 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Reputation</p>
          <div className="flex items-baseline gap-1.5">
            <span className={cn('text-4xl font-bold tabular-nums', scoreColor)}>{score.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ 5.0</span>
          </div>
          <Stars size={4} />
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end text-brand-400 mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-xl font-bold">{user.completion_streak || 8}</span>
          </div>
          <p className="text-xs text-muted-foreground">project streak</p>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <MetricRow icon={Clock}        label="On-time delivery" value={user.ontime_pct || 96}   color="text-green-400"  delay={0.1} />
        <MetricRow icon={MessageSquare} label="Communication"   value={user.comm_score || 88}   color="text-brand-400"  delay={0.15} />
        <MetricRow icon={TrendingUp}   label="Client retention" value={user.retention_pct || 75} color="text-blue-400"  delay={0.2} />
        <MetricRow icon={RefreshCw}    label="Low revision rate" value={82}                      color="text-purple-400" delay={0.25} />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        {[
          { label: 'Projects', value: user.total_projects || 24 },
          { label: 'Earnings', value: `$${Math.round((user.total_earnings || 12400) / 1000)}k` },
          { label: 'Reviews',  value: '47' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface-2 rounded-xl p-2.5 text-center">
            <p className="text-sm font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {user.is_verified && (
        <div className="flex items-center gap-2 pt-1">
          <Shield className="h-3.5 w-3.5 text-brand-400" />
          <span className="text-xs text-muted-foreground">Identity verified</span>
          <ReliabilityBadge level="gold" />
        </div>
      )}
    </motion.div>
  )
}
