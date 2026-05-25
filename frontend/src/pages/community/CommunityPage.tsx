/**
 * /community — M9
 * Freelancer browse grid with filter sidebar.
 */
import { useEffect, useState, useCallback } from 'react'
import { Search, Loader2, Users } from 'lucide-react'
import { useCommunityStore } from '@/store/communityStore'
import { FreelancerCard } from '@/components/community/FreelancerCard'
import { CommunityFilterSidebar } from '@/components/community/CommunityFilterSidebar'
import { cn } from '@/lib/utils'
import type { FreelancerFilters } from '@/api/community'
import { useDebounce } from '@/hooks/useDebounce'

const EMPTY_FILTERS: FreelancerFilters = {}

export default function CommunityPage() {
  const {
    freelancers, total, page, pages, loading,
    filters, fetchDirectory, fetchNextPage, toggleSave,
  } = useCommunityStore()

  const [searchText, setSearchText] = useState('')
  const [sidebarFilters, setSidebarFilters] = useState<FreelancerFilters>(EMPTY_FILTERS)
  const debouncedSearch = useDebounce(searchText, 400)

  // Trigger fetch when search or filters change
  useEffect(() => {
    fetchDirectory({ ...sidebarFilters, q: debouncedSearch || undefined })
  }, [debouncedSearch, sidebarFilters])

  const handleFilterChange = useCallback((f: FreelancerFilters) => {
    setSidebarFilters(f)
  }, [])

  const handleReset = useCallback(() => {
    setSidebarFilters(EMPTY_FILTERS)
    setSearchText('')
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse verified freelancers and find the right talent for your project.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-xl">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search by name, title, or skill…"
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/6 border border-white/10 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
        />
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar */}
        <CommunityFilterSidebar
          value={sidebarFilters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {/* Result count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading && !freelancers.length ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" /> Loading…
                </span>
              ) : (
                <>
                  <span className="font-medium text-foreground">{total.toLocaleString()}</span>{' '}
                  freelancer{total !== 1 ? 's' : ''} found
                </>
              )}
            </p>
          </div>

          {/* Empty state */}
          {!loading && freelancers.length === 0 && (
            <div className="py-24 text-center text-muted-foreground space-y-3">
              <Users size={40} className="mx-auto opacity-20" />
              <p className="text-sm">No freelancers match your filters.</p>
              <button
                onClick={handleReset}
                className="text-brand-400 text-sm hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {freelancers.map(f => (
              <FreelancerCard
                key={f.id}
                freelancer={f}
                onToggleSave={toggleSave}
              />
            ))}
            {/* Skeleton cards while loading */}
            {loading && freelancers.length === 0 && (
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-surface-1 h-52 animate-pulse" />
              ))
            )}
          </div>

          {/* Load more */}
          {page < pages && (
            <div className="mt-8 text-center">
              <button
                onClick={fetchNextPage}
                disabled={loading}
                className={cn(
                  'h-10 px-6 rounded-xl text-sm font-medium transition-colors',
                  loading
                    ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                    : 'bg-white/8 hover:bg-white/12 text-foreground',
                )}
              >
                {loading
                  ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading…</span>
                  : `Load more (${total - freelancers.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
