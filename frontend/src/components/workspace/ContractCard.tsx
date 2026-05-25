import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign, CheckCircle, Clock, MessageSquare,
  ArrowUpRight, Users, Layers,
} from 'lucide-react'
import { cn, formatCurrency, timeAgo } from '@/lib/utils'
import type { Contract, ContractStatus } from '@/types'
import { useAuthStore } from '@/store/authStore'

interface ContractCardProps {
  contract: Contract
  index?: number
}

const STATUS_STYLES: Record<ContractStatus, { label: string; dot: string; card: string }> = {
  active:    { label: 'Active',     dot: 'bg-green-400',           card: 'border-green-500/20' },
  paused:    { label: 'Paused',     dot: 'bg-yellow-400',          card: 'border-yellow-500/20' },
  completed: { label: 'Completed',  dot: 'bg-brand-400',           card: 'border-brand-500/20' },
  disputed:  { label: 'Disputed',   dot: 'bg-red-400 animate-pulse', card: 'border-red-500/20' },
  cancelled: { label: 'Cancelled',  dot: 'bg-muted-foreground',    card: 'border-white/[0.06]' },
}

export function ContractCard({ contract, index = 0 }: ContractCardProps) {
  const { user } = useAuthStore()
  const style     = STATUS_STYLES[contract.status]
  const isClient  = contract.client_id === user?.id
  const peer      = isClient ? contract.freelancer : contract.client
  const peerRole  = isClient ? 'Freelancer' : 'Client'

  const progress = contract.milestone_count
    ? Math.round(((contract.completed_milestones ?? 0) / contract.milestone_count) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'group glass rounded-2xl border p-5 hover:shadow-glow-sm transition-all duration-300',
        style.card,
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Link
            to={`/workspace/${contract.id}`}
            className="font-semibold text-sm line-clamp-1 hover:text-brand-300 transition-colors"
          >
            {contract.project?.title ?? 'Unnamed Project'}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            {peerRole}: {peer?.full_name ?? '—'}
            {peer?.is_verified && <CheckCircle className="inline h-3 w-3 text-brand-400 ml-1" />}
          </p>
        </div>

        {/* Status pill */}
        <span className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
          <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
          {style.label}
        </span>
      </div>

      {/* Progress bar (milestone completion) */}
      {(contract.milestone_count ?? 0) > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Milestones</span>
            <span>{contract.completed_milestones ?? 0}/{contract.milestone_count}</span>
          </div>
          <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-brand rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-white/[0.05]">
        <span className="flex items-center gap-1 font-medium text-foreground">
          <DollarSign className="h-3 w-3 text-brand-400" />
          {formatCurrency(contract.total_amount)}
        </span>

        {(contract.milestone_count ?? 0) > 0 && (
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {contract.milestone_count} milestone{contract.milestone_count !== 1 ? 's' : ''}
          </span>
        )}

        {(contract.unread_messages ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-brand-400 font-medium">
            <MessageSquare className="h-3 w-3" />
            {contract.unread_messages} new
          </span>
        )}

        <span className="ml-auto">{timeAgo(contract.created_at)}</span>

        <Link
          to={`/workspace/${contract.id}`}
          className="p-1 rounded-lg text-muted-foreground hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  )
}
