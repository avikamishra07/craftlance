/**
 * Dashboard.tsx — M9 misc fix
 *
 * All mock stats replaced with real data:
 *   - Active contracts from contractStore
 *   - Pending proposals from projectStore
 *   - Earnings from paymentStore
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, FileText, DollarSign, Star, ArrowRight, Loader2 } from 'lucide-react'
import { useContractStore } from '@/store/contractStore'
import { useProposalStore } from '@/store/proposalStore'
import { usePaymentStore } from '@/store/paymentStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label:    string
  value:    string | number
  sub?:     string
  icon:     React.ElementType
  color:    string
  loading?: boolean
  to?:      string
}

function StatCard({ label, value, sub, icon: Icon, color, loading, to }: StatCardProps) {
  const inner = (
    <div className={cn(
      'rounded-xl border bg-surface-1 p-5 flex gap-4 items-start transition-all duration-200',
      to ? 'hover:border-white/15 cursor-pointer' : '',
      'border-white/8',
    )}>
      <div className={cn('p-2.5 rounded-lg shrink-0', color)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {loading ? (
          <div className="h-6 w-16 rounded bg-white/8 animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold mt-0.5">{value}</p>
        )}
        {sub && !loading && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
      {to && <ArrowRight size={14} className="text-muted-foreground shrink-0 mt-1" />}
    </div>
  )

  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function Dashboard() {
  const { user } = useAuthStore()

  const {
    contracts, contractsLoading, fetchContracts,
  } = useContractStore()

  const {
    myProposals, myProposalsLoading, fetchMyProposals,
  } = useProposalStore()

  const {
    summary, summaryLoading, fetchSummary,
  } = usePaymentStore()

  useEffect(() => {
    fetchContracts()
    fetchMyProposals()
    fetchSummary()
  }, [])

  // Derived stats from real store data
  const activeContracts = contracts.filter(c => c.status === 'active').length
  const pendingProposals = myProposals.filter(p => p.status === 'pending').length
  const totalEarnings = summary?.total_earned ?? 0
  const pendingPayouts = summary?.pending_payout ?? 0
  const avgRating = summary?.avg_rating ?? null

  const stats: StatCardProps[] = [
    {
      label:   'Active Contracts',
      value:   activeContracts,
      icon:    Briefcase,
      color:   'bg-brand-500/15 text-brand-400',
      loading: contractsLoading,
      to:      '/dashboard/projects',
    },
    {
      label:   'Pending Proposals',
      value:   pendingProposals,
      icon:    FileText,
      color:   'bg-amber-500/15 text-amber-400',
      loading: myProposalsLoading,
      to:      '/dashboard/proposals',
    },
    {
      label:   'Total Earnings',
      value:   `$${totalEarnings.toLocaleString()}`,
      sub:     pendingPayouts > 0 ? `$${pendingPayouts.toLocaleString()} pending payout` : undefined,
      icon:    DollarSign,
      color:   'bg-emerald-500/15 text-emerald-400',
      loading: summaryLoading,
      to:      '/dashboard/payments',
    },
    {
      label:   'Avg Rating',
      value:   avgRating != null ? avgRating.toFixed(1) + ' ★' : '—',
      sub:     summary?.review_count ? `${summary.review_count} review${summary.review_count !== 1 ? 's' : ''}` : undefined,
      icon:    Star,
      color:   'bg-yellow-500/15 text-yellow-400',
      loading: summaryLoading,
      to:      '/dashboard/reviews',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening with your account.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/projects',        label: 'Browse Projects',    desc: 'Find new work' },
          { to: '/community',       label: 'Community',          desc: 'Discover freelancers' },
          { to: '/dashboard/skills',label: 'Skill Verification', desc: 'Earn badges' },
        ].map(({ to, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="rounded-xl border border-white/8 bg-surface-1 p-4 hover:border-white/15 transition-colors flex items-center justify-between gap-2 group"
          >
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  )
}
