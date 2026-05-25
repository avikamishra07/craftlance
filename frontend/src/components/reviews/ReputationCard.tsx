import { useEffect } from 'react'
import { Star, MessageSquare, CheckCircle, Clock, ThumbsUp } from 'lucide-react'
import { useReviewStore } from '@/store/reviewStore'

interface ReputationCardProps {
  userId: string
}

function ScoreBar({ value, max = 5 }: { value?: number; max?: number }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>
  const pct = (value / max) * 100
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium w-6 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

const METRICS = [
  { key: 'avg_communication', label: 'Communication', icon: MessageSquare },
  { key: 'avg_quality',       label: 'Quality',        icon: CheckCircle },
  { key: 'avg_ontime',        label: 'On-time',        icon: Clock },
  { key: 'avg_recommend',     label: 'Recommend',      icon: ThumbsUp },
] as const

export function ReputationCard({ userId }: ReputationCardProps) {
  const { reputationByUser, reputationLoading, fetchReputation } = useReviewStore()
  const rep     = reputationByUser[userId]
  const loading = reputationLoading[userId] ?? false

  useEffect(() => {
    fetchReputation(userId)
  }, [userId])

  if (loading) {
    return <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
  }

  if (!rep || rep.review_count === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-surface-1 p-5">
        <p className="text-sm text-muted-foreground text-center py-4">No reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/8 bg-surface-1 p-5 space-y-4">
      {/* Overall score hero */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Star size={20} className="fill-amber-400 stroke-amber-400" />
          <span className="text-2xl font-bold">{rep.avg_overall?.toFixed(1) ?? '—'}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          from {rep.review_count} review{rep.review_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Category breakdown */}
      <div className="space-y-2.5">
        {METRICS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="grid grid-cols-[20px_1fr_80px] items-center gap-2">
            <Icon size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{label}</span>
            <ScoreBar value={rep[key]} />
          </div>
        ))}
      </div>
    </div>
  )
}
