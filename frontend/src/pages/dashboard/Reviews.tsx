import { useEffect } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { useReviewStore } from '@/store/reviewStore'
import { useAuthStore } from '@/store/authStore'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { ReputationCard } from '@/components/reviews/ReputationCard'

export default function ReviewsDashboard() {
  const user = useAuthStore((s) => s.user)
  const {
    reviewsByUser, reviewsLoading, fetchUserReviews,
    myReviews, myReviewsLoading, fetchMyReviews,
  } = useReviewStore()

  const receivedReviews = user ? (reviewsByUser[user.id] ?? []) : []
  const receivedLoading = user ? (reviewsLoading[user.id] ?? false) : false

  useEffect(() => {
    if (!user) return
    fetchUserReviews(user.id)
    fetchMyReviews()
  }, [user?.id])

  const isFreelancer = user?.role === 'freelancer' || user?.role === 'both'
  const isClient     = user?.role === 'client'     || user?.role === 'both'

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isFreelancer
          ? "Reviews you've received from clients."
          : "Reviews you've left for freelancers."
          }
        </p>
      </div>

      {/* Freelancer: show received reviews + reputation */}
      {isFreelancer && user && (
        <section className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Star size={16} className="text-amber-400" />
            Reviews Received
          </h2>
          <ReputationCard userId={user.id} />

          {receivedLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : receivedReviews.length ? (
            <div className="space-y-3">
              {receivedReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet — complete a contract to start building your reputation.</p>
          )}
        </section>
      )}

      {/* Client: show reviews they've left */}
      {isClient && (
        <section className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare size={16} className="text-brand-400" />
            Reviews You've Left
          </h2>
          {myReviewsLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : myReviews.length ? (
            <div className="space-y-3">
              {myReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">You haven't left any reviews yet.</p>
          )}
        </section>
      )}
    </div>
  )
}
