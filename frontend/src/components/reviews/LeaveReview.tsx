import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { StarRating } from './StarRating'
import { useReviewStore } from '@/store/reviewStore'
import type { ReviewCreatePayload } from '@/types'

interface LeaveReviewProps {
  contractId: string
  revieweeName: string
  onClose: () => void
  onSuccess?: () => void
}

const CATEGORIES: { key: keyof ReviewCreatePayload; label: string; hint: string }[] = [
  { key: 'communication_rating', label: 'Communication',    hint: 'Responsiveness and clarity' },
  { key: 'quality_rating',       label: 'Quality of Work',  hint: 'Deliverable quality' },
  { key: 'ontime_rating',        label: 'On-time Delivery', hint: 'Met deadlines' },
  { key: 'recommend_rating',     label: 'Would Recommend',  hint: 'Likelihood to work together again' },
]

export function LeaveReview({ contractId, revieweeName, onClose, onSuccess }: LeaveReviewProps) {
  const { submit } = useReviewStore()
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [ratings, setRatings] = useState<Record<string, number>>({
    overall_rating: 0,
    communication_rating: 0,
    quality_rating: 0,
    ontime_rating: 0,
    recommend_rating: 0,
  })
  const [body, setBody] = useState('')

  const setRating = (key: string, val: number) =>
    setRatings((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!ratings.overall_rating) {
      setError('Please provide an overall rating.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload: ReviewCreatePayload = {
        overall_rating: ratings.overall_rating,
        body: body.trim() || undefined,
        communication_rating: ratings.communication_rating || undefined,
        quality_rating:       ratings.quality_rating || undefined,
        ontime_rating:        ratings.ontime_rating || undefined,
        recommend_rating:     ratings.recommend_rating || undefined,
      }
      await submit(contractId, payload)
      onSuccess?.()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to submit review.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-2 rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="font-semibold text-lg">Leave a Review</h2>
            <p className="text-sm text-muted-foreground">for {revieweeName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Overall */}
          <div>
            <label className="text-sm font-medium mb-2 block">Overall Rating *</label>
            <StarRating
              value={ratings.overall_rating}
              onChange={(v) => setRating('overall_rating', v)}
              size="lg"
            />
          </div>

          {/* Category ratings */}
          <div className="space-y-3">
            {CATEGORIES.map(({ key, label, hint }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <StarRating
                  value={ratings[key as string] ?? 0}
                  onChange={(v) => setRating(key as string, v)}
                  size="md"
                />
              </div>
            ))}
          </div>

          {/* Written review */}
          <div>
            <label className="text-sm font-medium mb-2 block">Written Review (optional)</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience working with this person…"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted-foreground"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/8">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm hover:bg-white/8 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !ratings.overall_rating}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  )
}
