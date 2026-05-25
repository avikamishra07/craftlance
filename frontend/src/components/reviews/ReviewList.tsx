import { useEffect, useState } from 'react'
import { ReviewCard } from './ReviewCard'
import { useReviewStore } from '@/store/reviewStore'

interface ReviewListProps {
  userId: string
}

export function ReviewList({ userId }: ReviewListProps) {
  const { reviewsByUser, reviewsLoading, fetchUserReviews } = useReviewStore()
  const reviews = reviewsByUser[userId] ?? []
  const loading  = reviewsLoading[userId] ?? false

  useEffect(() => {
    fetchUserReviews(userId)
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!reviews.length) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No reviews yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </div>
  )
}
