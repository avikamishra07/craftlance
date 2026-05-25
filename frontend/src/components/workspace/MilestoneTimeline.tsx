import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, Circle, Clock, Upload, RotateCcw,
  DollarSign, Calendar, ChevronDown, ChevronUp,
  Plus, AlertCircle, Loader2, Lock, Unlock,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Milestone, MilestoneStatus, Contract } from '@/types'
import { useContractStore } from '@/store/contractStore'
import { usePaymentStore } from '@/store/paymentStore'   // M5
import { useAuthStore } from '@/store/authStore'

interface MilestoneTimelineProps {
  contract: Contract
  milestones: Milestone[]
}

// ── Status meta ───────────────────────────────────────────────────────────────
const STATUS_META: Record<MilestoneStatus, {
  label: string
  icon: React.ElementType
  color: string
  bg: string
}> = {
  pending:            { label: 'Pending',          icon: Circle,      color: 'text-muted-foreground', bg: 'bg-surface-3' },
  in_progress:        { label: 'In Progress',      icon: Clock,       color: 'text-yellow-400',       bg: 'bg-yellow-500/10' },
  submitted:          { label: 'Under Review',     icon: Upload,      color: 'text-blue-400',         bg: 'bg-blue-500/10' },
  revision_requested: { label: 'Revision Needed',  icon: RotateCcw,   color: 'text-orange-400',       bg: 'bg-orange-500/10' },
  approved:           { label: 'Approved',         icon: CheckCircle, color: 'text-green-400',        bg: 'bg-green-500/10' },
  paid:               { label: 'Paid',             icon: DollarSign,  color: 'text-brand-400',        bg: 'bg-brand-500/10' },
}

// ── Escrow badge (M5) ─────────────────────────────────────────────────────────
function EscrowBadge({ milestoneId }: { milestoneId: string }) {
  const { escrowMap } = usePaymentStore()
  const payment = escrowMap[milestoneId]
  if (!payment) return null

  const cfg = {
    processing: { label: 'In Escrow', icon: Lock,   cls: 'text-blue-400 bg-blue-500/10' },
    completed:  { label: 'Released',  icon: Unlock, cls: 'text-brand-400 bg-brand-500/10' },
  }[payment.status]

  if (!cfg) return null
  const Icon = cfg.icon

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full', cfg.cls)}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  )
}

// ── Add milestone form ────────────────────────────────────────────────────────
function AddMilestoneForm({
  contractId,
  nextIndex,
  onDone,
}: {
  contractId: string
  nextIndex: number
  onDone: () => void
}) {
  const { addMilestone } = useContractStore()
  const [title, setTitle]     = useState('')
  const [amount, setAmount]   = useState('')
  const [dueDate, setDueDate] = useState('')
  const [desc, setDesc]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim() || !amount) { setError('Title and amount are required'); return }
    setLoading(true); setError(null)
    try {
      await addMilestone(contractId, {
        title: title.trim(),
        description: desc.trim() || undefined,
        amount: Number(amount),
        due_date: dueDate || undefined,
        order_index: nextIndex,
      })
      onDone()
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to add milestone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="ml-9 bg-surface-3 rounded-xl border border-white/[0.06] p-4 space-y-3"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Milestone</p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Milestone title *"
        className="input-premium w-full text-sm"
      />
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="input-premium w-full text-sm resize-none"
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <input
            type="number" min={1} value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount *"
            className="input-premium w-full pl-7 text-sm"
          />
        </div>
        <input
          type="date"
          value={dueDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setDueDate(e.target.value)}
          className="input-premium w-full text-sm"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />{error}
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={onDone}
          className="flex-1 py-2 rounded-lg text-sm bg-surface-4 text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-2 rounded-lg text-sm bg-gradient-brand text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5">
          {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding…</> : 'Add Milestone'}
        </button>
      </div>
    </motion.div>
  )
}

// ── Single milestone row ──────────────────────────────────────────────────────
function MilestoneRow({
  milestone,
  isLast,
  isClient,
  isFreelancer,
  contractId,
}: {
  milestone: Milestone
  isLast: boolean
  isClient: boolean
  isFreelancer: boolean
  contractId: string
}) {
  const { updateMilestoneStatus } = useContractStore()
  const { escrowMap, fundEscrow, release } = usePaymentStore()  // M5

  const [expanded, setExpanded]   = useState(false)
  const [loading, setLoading]     = useState<MilestoneStatus | null>(null)
  const [payLoading, setPayLoad]  = useState<'fund' | 'release' | null>(null)
  const [revNote, setRevNote]     = useState('')
  const [delivUrls, setDelivUrls] = useState('')
  const [payErr, setPayErr]       = useState<string | null>(null)

  const meta    = STATUS_META[milestone.status]
  const Icon    = meta.icon
  const payment = escrowMap[milestone.id]

  const isDue = milestone.due_date
    ? new Date(milestone.due_date) < new Date() && milestone.status !== 'paid' && milestone.status !== 'approved'
    : false

  const act = async (status: MilestoneStatus, extra: Record<string, any> = {}) => {
    setLoading(status)
    try {
      await updateMilestoneStatus(milestone.id, { status, ...extra })
    } finally {
      setLoading(null)
    }
  }

  // M5: escrow actions
  const handleFundEscrow = async () => {
    setPayLoad('fund'); setPayErr(null)
    try { await fundEscrow(milestone.id) }
    catch (e: any) { setPayErr(e.response?.data?.detail ?? 'Failed to fund escrow') }
    finally { setPayLoad(null) }
  }

  const handleRelease = async () => {
    setPayLoad('release'); setPayErr(null)
    try { await release(milestone.id) }
    catch (e: any) { setPayErr(e.response?.data?.detail ?? 'Failed to release payment') }
    finally { setPayLoad(null) }
  }

  const canFundEscrow    = isClient && milestone.status !== 'pending' && (!payment || payment.status === 'pending')
  const canReleasePayment = isClient && milestone.status === 'approved' && payment?.status === 'processing'

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 border', meta.bg,
          milestone.status === 'paid' ? 'border-brand-500/30' : 'border-white/[0.08]')}>
          <Icon className={cn('h-4 w-4', meta.color)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-white/[0.06] mt-1" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
        <div
          className="flex items-start justify-between gap-2 cursor-pointer"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium leading-snug">{milestone.title}</p>
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', meta.bg, meta.color)}>
                {meta.label}
              </span>
              {isDue && (
                <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">Overdue</span>
              )}
              {/* M5: escrow badge */}
              <EscrowBadge milestoneId={milestone.id} />
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(milestone.amount)}
              </span>
              {milestone.due_date && (
                <span className={cn('flex items-center gap-1', isDue && 'text-red-400')}>
                  <Calendar className="h-3 w-3" />
                  {formatDate(milestone.due_date)}
                </span>
              )}
            </div>
          </div>
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Expanded detail + actions */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                {milestone.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{milestone.description}</p>
                )}

                {milestone.revision_note && (
                  <div className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/20 text-xs text-orange-400">
                    <p className="font-medium mb-0.5">Revision requested:</p>
                    <p>{milestone.revision_note}</p>
                  </div>
                )}

                {milestone.deliverable_urls && milestone.deliverable_urls.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Deliverables:</p>
                    {milestone.deliverable_urls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                        className="block text-xs text-brand-400 hover:underline truncate">{url}</a>
                    ))}
                  </div>
                )}

                {/* Freelancer actions */}
                {isFreelancer && (
                  <div className="flex flex-wrap gap-2">
                    {milestone.status === 'pending' && (
                      <button disabled={!!loading} onClick={() => act('in_progress')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors disabled:opacity-50 flex items-center gap-1">
                        {loading === 'in_progress' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                        Start Work
                      </button>
                    )}
                    {(milestone.status === 'in_progress' || milestone.status === 'revision_requested') && (
                      <div className="w-full space-y-2">
                        <input value={delivUrls} onChange={(e) => setDelivUrls(e.target.value)}
                          placeholder="Deliverable URL(s), comma-separated"
                          className="input-premium w-full text-xs py-2" />
                        <button disabled={!!loading}
                          onClick={() => act('submitted', {
                            deliverable_urls: delivUrls ? delivUrls.split(',').map((u) => u.trim()) : undefined,
                          })}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50 flex items-center gap-1">
                          {loading === 'submitted' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                          Submit for Review
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Client: approve / request revision */}
                {isClient && milestone.status === 'submitted' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button disabled={!!loading} onClick={() => act('approved')}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        {loading === 'approved' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Approve
                      </button>
                      <button disabled={!!loading}
                        onClick={() => act('revision_requested', { revision_note: revNote || 'Please revise the deliverables.' })}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        {loading === 'revision_requested' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                        Request Revision
                      </button>
                    </div>
                    <textarea value={revNote} onChange={(e) => setRevNote(e.target.value)}
                      placeholder="Revision notes (required if requesting revision)…"
                      rows={2} className="input-premium w-full text-xs resize-none" />
                  </div>
                )}

                {/* M5: Client escrow / release actions */}
                {isClient && (canFundEscrow || canReleasePayment) && (
                  <div className="pt-1 border-t border-white/[0.06] space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Payment</p>
                    <div className="flex gap-2">
                      {canFundEscrow && (
                        <button
                          disabled={!!payLoading}
                          onClick={handleFundEscrow}
                          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                          {payLoading === 'fund' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
                          Fund Escrow
                        </button>
                      )}
                      {canReleasePayment && (
                        <button
                          disabled={!!payLoading}
                          onClick={handleRelease}
                          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-gradient-brand text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1">
                          {payLoading === 'release' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3" />}
                          Release Payment
                        </button>
                      )}
                    </div>
                    {payErr && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />{payErr}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function MilestoneTimeline({ contract, milestones }: MilestoneTimelineProps) {
  const { user } = useAuthStore()
  const [addingMilestone, setAddingMilestone] = useState(false)

  const isClient     = contract.client_id === user?.id
  const isFreelancer = contract.freelancer_id === user?.id
  const isActive     = contract.status === 'active'

  const totalPaid     = milestones.filter((m) => m.status === 'paid').reduce((s, m) => s + m.amount, 0)
  const totalApproved = milestones.filter((m) => m.status === 'approved').reduce((s, m) => s + m.amount, 0)
  const totalPending  = milestones.filter((m) => !['paid'].includes(m.status)).reduce((s, m) => s + m.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Paid',     value: totalPaid,     color: 'text-brand-400' },
            { label: 'Approved', value: totalApproved, color: 'text-green-400' },
            { label: 'Pending',  value: totalPending,  color: 'text-muted-foreground' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface-3 rounded-xl p-3 border border-white/[0.05] text-center">
              <p className={cn('text-sm font-semibold', color)}>{formatCurrency(value)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {milestones.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No milestones yet</p>
          {isClient && isActive && (
            <p className="text-xs text-muted-foreground mt-1">Add milestones to track project progress</p>
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {milestones.map((m, i) => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              isLast={i === milestones.length - 1 && !addingMilestone}
              isClient={isClient}
              isFreelancer={isFreelancer}
              contractId={contract.id}
            />
          ))}
        </div>
      )}

      {/* Add milestone form */}
      <AnimatePresence>
        {addingMilestone && (
          <AddMilestoneForm
            contractId={contract.id}
            nextIndex={milestones.length}
            onDone={() => setAddingMilestone(false)}
          />
        )}
      </AnimatePresence>

      {/* Add button (client only, active contract) */}
      {isClient && isActive && !addingMilestone && (
        <button
          onClick={() => setAddingMilestone(true)}
          className="flex items-center gap-2 w-full py-2.5 rounded-xl text-sm text-muted-foreground border border-dashed border-white/[0.12] hover:border-brand-500/30 hover:text-brand-400 transition-all"
        >
          <Plus className="h-4 w-4 mx-auto" />
          <span>Add Milestone</span>
        </button>
      )}
    </div>
  )
}
