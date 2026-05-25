/**
 * MyProposals — M7 update
 *
 * Changes from M3 version:
 * - Imports AIFeedbackPanel and renders it per proposal when ai_score data is present
 * - Adds re-score action via POST /proposals/:id/score
 * - Polls pending proposals every 10 s to pick up scores as they arrive
 */
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useProposalStore } from '@/store/proposalStore'
import { AIFeedbackPanel } from '@/components/proposals/AIFeedbackPanel'
import { api } from '@/api/client'
import type { Proposal, ProposalStatus } from '@/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProposalStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending:     { label: 'Pending',     icon: Clock,         className: 'text-amber-400 bg-amber-400/10' },
  shortlisted: { label: 'Shortlisted', icon: AlertCircle,   className: 'text-blue-400 bg-blue-400/10' },
  accepted:    { label: 'Accepted',    icon: CheckCircle2,  className: 'text-green-400 bg-green-400/10' },
  rejected:    { label: 'Rejected',    icon: XCircle,       className: 'text-red-400 bg-red-400/10' },
  withdrawn:   { label: 'Withdrawn',   icon: XCircle,       className: 'text-muted-foreground bg-white/5' },
}

// ── ProposalRow ───────────────────────────────────────────────────────────────

function ProposalRow({ proposal }: { proposal: Proposal }) {
  const [expanded,  setExpanded]  = useState(false)
  const [rescoring, setRescoring] = useState(false)
  const cfg = STATUS_CONFIG[proposal.status]
  const Icon = cfg.icon

  const handleRescore = async () => {
    setRescoring(true)
    try {
      await api.post(`/proposals/${proposal.id}/score`)
    } finally {
      setRescoring(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/8 bg-surface-1 overflow-hidden">
      {/* Summary row */}
      <div className="flex items-start gap-4 p-4">
        <div className="flex-1 min-w-0">
          <Link
            to={`/projects/${proposal.project_id}`}
            className="font-medium hover:text-brand-300 transition-colors line-clamp-1"
          >
            {proposal.project_title ?? 'Project'}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bid ${proposal.bid_amount.toLocaleString()} · {proposal.timeline_days}d ·{' '}
            {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Status badge */}
        <span className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0', cfg.className)}>
          <Icon size={12} />
          {cfg.label}
        </span>

        {/* AI score badge + expand toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {proposal.ai_score != null ? (
            <span className="text-xs font-semibold text-brand-300 bg-brand-500/15 px-2 py-1 rounded-full">
              AI {proposal.ai_score}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
              AI …
            </span>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded hover:bg-white/8 transition-colors text-muted-foreground"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded: cover letter + AI panel */}
      {expanded && (
        <div className="border-t border-white/8 px-4 pb-4 space-y-4 pt-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Cover Letter</p>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {proposal.cover_letter}
            </p>
          </div>
          <AIFeedbackPanel
            proposal={proposal}
            onRescore={handleRescore}
            rescoring={rescoring}
          />
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyProposals() {
  const { myProposals, myProposalsLoading, fetchMyProposals } = useProposalStore()

  useEffect(() => {
    fetchMyProposals()
  }, [])

  // Poll every 10 s while any proposal has ai_score === null
  const hasPending = myProposals.some((p) => p.ai_score == null && p.status === 'pending')

  useEffect(() => {
    if (!hasPending) return
    const id = setInterval(() => fetchMyProposals(), 10_000)
    return () => clearInterval(id)
  }, [hasPending])

  if (myProposalsLoading && !myProposals.length) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Proposals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {myProposals.length} proposal{myProposals.length !== 1 ? 's' : ''} submitted
        </p>
      </div>

      {!myProposals.length ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm">You haven't submitted any proposals yet.</p>
          <Link to="/projects" className="text-brand-400 text-sm hover:underline mt-2 inline-block">
            Browse projects →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myProposals.map((p) => (
            <ProposalRow key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  )
}
