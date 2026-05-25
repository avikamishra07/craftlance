import { formatDistanceToNow } from 'date-fns'
import { StarRating } from './StarRating'
import type { Review } from '@/types'

interface ReviewCardProps {
  review: Review
}

const CATEGORIES = [
  { key: 'communication_rating', label: 'Communication' },
  { key: 'quality_rating',       label: 'Quality' },
  { key: 'ontime_rating',        label: 'On-time' },
  { key: 'recommend_rating',     label: 'Would Recommend' },
] as const

export function ReviewCard({ review }: ReviewCardProps) {
  const reviewer = review.reviewer
  const initials = reviewer?.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??'

  return (
    <div className="rounded-xl border border-white/8 bg-surface-1 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {reviewer?.avatar_url ? (
          <img
            src={reviewer.avatar_url}
            alt={reviewer.full_name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-semibold text-brand-300 shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{reviewer?.full_name ?? 'Anonymous'}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
          </p>
        </div>
        <StarRating value={review.overall_rating} readOnly size="sm" />
      </div>

      {/* Body text */}
      {review.body && (
        <p className="text-sm text-foreground/80 leading-relaxed">{review.body}</p>
      )}

      {/* Category breakdown */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {CATEGORIES.map(({ key, label }) => {
          const val = review[key]
          if (!val) return null
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <StarRating value={val} readOnly size="sm" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
