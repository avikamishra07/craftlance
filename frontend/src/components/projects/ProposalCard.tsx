import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronUp, Clock, DollarSign,
  Star, CheckCircle, XCircle, Bookmark, ExternalLink,
  Zap, MessageSquare,
} from 'lucide-react'
import { cn, formatCurrency, timeAgo } from '@/lib/utils'
import type { Proposal, ProposalStatus } from '@/types'
import { useProjectStore } from '@/store/projectStore'

interface ProposalCardProps {
  proposal: Proposal
  /** If true, renders the freelancer-facing "my proposals" variant */
  myView?: boolean
}

const STATUS_STYLES: Record<ProposalStatus, { label: string; className: string }> = {
  pending:     { label: 'Pending',     className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  shortlisted: { label: 'Shortlisted', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  accepted:    { label: 'Accepted',    className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rejected:    { label: 'Rejected',    className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  withdrawn:   { label: 'Withdrawn',   className: 'bg-surface-4 text-muted-foreground border-white/10' },
}

/** Circular arc SVG for AI score */
function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#8b5cf6' : '#f59e0b'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>
        {Math.round(score)}
      </span>
    </div>
  )
}

export function ProposalCard({ proposal, myView = false }: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState<ProposalStatus | null>(null)
  const { updateProposalStatus } = useProjectStore()

  const status = STATUS_STYLES[proposal.status]
  const fl = proposal.freelancer
  const hasAiScore = proposal.ai_score != null

  const handleAction = async (newStatus: ProposalStatus) => {
    setActionLoading(newStatus)
    try {
      await updateProposalStatus(proposal.id, newStatus)
    } finally {
      setActionLoading(null)
    }
  }

  const canAct = !myView && (proposal.status === 'pending' || proposal.status === 'shortlisted')
  const canWithdraw = myView && (proposal.status === 'pending' || proposal.status === 'shortlisted')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass rounded-2xl border border-white/[0.06] overflow-hidden',
        'hover:border-brand-500/20 transition-all duration-300',
        proposal.status === 'accepted' && 'border-green-500/20',
        proposal.status === 'shortlisted' && 'border-blue-500/20',
      )}
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {fl?.avatar_url ? (
              <img src={fl.avatar_url} alt={fl.full_name}
                className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-base font-bold text-brand-300">
                {fl?.full_name?.[0] ?? '?'}
              </div>
            )}
            {fl?.is_verified && (
              <CheckCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-brand-400 bg-surface-2 rounded-full" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-semibold text-sm leading-tight">
                  {fl?.full_name ?? 'Freelancer'}
                </p>
                {fl?.title && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{fl.title}</p>
                )}
                {fl?.location && (
                  <p className="text-xs text-muted-foreground">{fl.location}</p>
                )}
              </div>

              {/* Status + AI score */}
              <div className="flex items-center gap-2 shrink-0">
                {hasAiScore && <ScoreRing score={proposal.ai_score!} />}
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium border',
                  status.className,
                )}>
                  {status.label}
                </span>
              </div>
            </div>

            {/* Freelancer skills */}
            {fl?.skills && fl.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {fl.skills.slice(0, 4).map((s) => (
                  <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-surface-3 text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bid meta */}
        <div className="flex items-center gap-5 mt-3 text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            <DollarSign className="h-3.5 w-3.5 text-brand-400" />
            {formatCurrency(proposal.bid_amount)}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {proposal.timeline_days} day{proposal.timeline_days !== 1 ? 's' : ''}
          </span>
          {fl?.reputation_score > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-yellow-400" />
              {fl.reputation_score.toFixed(1)}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {timeAgo(proposal.created_at)}
          </span>
        </div>

        {/* Cover letter preview + expand */}
        <div className="mt-3">
          <p className={cn(
            'text-sm text-muted-foreground leading-relaxed',
            !expanded && 'line-clamp-2',
          )}>
            {proposal.cover_letter}
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-1 transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="h-3 w-3" /> Show less</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Read more</>
            )}
          </button>
        </div>
      </div>

      {/* Expanded: AI breakdown + actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* AI Scores breakdown */}
            {hasAiScore && (
              <div className="px-4 pb-3 pt-1 border-t border-white/[0.05]">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-brand-400" /> AI Proposal Analysis
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Clarity',        value: proposal.ai_clarity_score },
                    { label: 'Relevance',      value: proposal.ai_relevance_score },
                    { label: 'Professional',   value: proposal.ai_professionalism_score },
                    { label: 'Value',          value: proposal.ai_value_score },
                  ].map(({ label, value }) => value != null && (
                    <div key={label} className="bg-surface-3 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={cn(
                        'text-sm font-bold mt-0.5',
                        value >= 80 ? 'text-green-400' : value >= 60 ? 'text-brand-400' : 'text-yellow-400',
                      )}>
                        {Math.round(value)}
                      </p>
                    </div>
                  ))}
                </div>
                {proposal.ai_feedback && (
                  <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed">
                    "{proposal.ai_feedback}"
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            {(canAct || canWithdraw) && (
              <div className="flex items-center gap-2 px-4 pb-4 pt-2 border-t border-white/[0.05]">
                {canAct && (
                  <>
                    {proposal.status === 'pending' && (
                      <button
                        disabled={!!actionLoading}
                        onClick={() => handleAction('shortlisted')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        {actionLoading === 'shortlisted' ? 'Saving…' : 'Shortlist'}
                      </button>
                    )}
                    <button
                      disabled={!!actionLoading}
                      onClick={() => handleAction('accepted')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {actionLoading === 'accepted' ? 'Accepting…' : 'Accept'}
                    </button>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => handleAction('rejected')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {actionLoading === 'rejected' ? 'Rejecting…' : 'Decline'}
                    </button>
                  </>
                )}

                {canWithdraw && (
                  <button
                    disabled={!!actionLoading}
                    onClick={() => handleAction('withdrawn')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-3 text-muted-foreground border border-white/[0.06] hover:text-red-400 hover:border-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'withdrawn' ? 'Withdrawing…' : 'Withdraw'}
                  </button>
                )}

                <a
                  href={`/profile/${proposal.freelancer_id}`}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-brand-400 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Profile
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
