/**
 * /dashboard/saved — M9
 * Saved freelancers grid.
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Loader2 } from 'lucide-react'
import { useCommunityStore } from '@/store/communityStore'
import { FreelancerCard } from '@/components/community/FreelancerCard'

export default function SavedFreelancers() {
  const { saved, savedLoading, fetchSaved, toggleSave } = useCommunityStore()

  useEffect(() => {
    fetchSaved()
  }, [])

  if (savedLoading && !saved.length) {
    return (
      <div className="max-w-5xl mx-auto py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-surface-1 h-52 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Freelancers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {saved.length} saved freelancer{saved.length !== 1 ? 's' : ''}
        </p>
      </div>

      {!savedLoading && saved.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground space-y-3">
          <Bookmark size={40} className="mx-auto opacity-20" />
          <p className="text-sm">You haven't saved any freelancers yet.</p>
          <Link to="/community" className="text-brand-400 text-sm hover:underline">
            Browse the community →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map(f => (
            <FreelancerCard
              key={f.id}
              freelancer={f}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
