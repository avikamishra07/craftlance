/**
 * EscrowPanel.tsx — M5
 * Renders inside WorkspaceDetail's Milestones tab.
 * Shows escrow status per milestone with Fund + Release actions for the client.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Lock, Unlock, DollarSign,
  CheckCircle2, AlertCircle, Loader2, Clock,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Milestone, Contract, Payment, PaymentStatus } from '@/types'
import { usePaymentStore } from '@/store/paymentStore'
import { useAuthStore } from '@/store/authStore'

interface EscrowPanelProps {
  contract: Contract
  milestones: Milestone[]
}

// ── Mock data fallback ────────────────────────────────────────────────────────
function buildMockPayment(milestone: Milestone): Payment {
  const statuses: PaymentStatus[] = ['pending', 'processing', 'completed']
  const status = statuses[milestone.order_index % 3]
  return {
    id: `mock-${milestone.id}`,
    milestone_id: milestone.id,
    contract_id: milestone.contract_id,
    payer_id: 'mock-payer',
    payee_id: 'mock-payee',
    gross_amount: milestone.amount,
    platform_fee: Math.round(milestone.amount * 0.1),
    net_amount: Math.round(milestone.amount * 0.9),
    status,
    escrow_funded_at: status !== 'pending' ? new Date().toISOString() : undefined,
    released_at: status === 'completed' ? new Date().toISOString() : undefined,
    created_at: milestone.created_at,
  }
}

// ── Status config ─────────────────────────────────────────────────────────────
const ESCROW_META: Record<PaymentStatus, {
  label: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}> = {
  pending:    { label: 'Not Funded',  icon: Clock,        color: 'text-muted-foreground', bg: 'bg-surface-3',     border: 'border-white/[0.06]' },
  processing: { label: 'In Escrow',   icon: Lock,         color: 'text-blue-400',         bg: 'bg-blue-500/10',   border: 'border-blue-500/20'  },
  completed:  { label: 'Released',    icon: Unlock,       color: 'text-brand-400',        bg: 'bg-brand-500/10',  border: 'border-brand-500/20' },
  failed:     { label: 'Failed',      icon: AlertCircle,  color: 'text-red-400',          bg: 'bg-red-500/10',    border: 'border-red-500/20'   },
  refunded:   { label: 'Refunded',    icon: CheckCircle2, color: 'text-yellow-400',       bg: 'bg-yellow-500/10', border: 'border-yellow-500/20'},
}

// ── Row ───────────────────────────────────────────────────────────────────────
function EscrowRow({
  milestone,
  payment,
  isClient,
  onFund,
  onRelease,
}: {
  milestone: Milestone
  payment: Payment | null
  isClient: boolean
  onFund: (milestoneId: string) => Promise<void>
  onRelease: (milestoneId: string) => Promise<void>
}) {
  const [loading, setLoading] = useState<'fund' | 'release' | null>(null)
  const [err, setErr]         = useState<string | null>(null)

  const status = payment?.status ?? 'pending'
  const meta   = ESCROW_META[status]
  const Icon   = meta.icon

  const canFund    = isClient && milestone.status !== 'pending' && status === 'pending'
  const canRelease = isClient && milestone.status === 'approved' && status === 'processing'

  const handleFund = async () => {
    setLoading('fund'); setErr(null)
    try { await onFund(milestone.id) }
    catch (e: any) { setErr(e.response?.data?.detail ?? 'Failed to fund escrow') }
    finally { setLoading(null) }
  }

  const handleRelease = async () => {
    setLoading('release'); setErr(null)
    try { await onRelease(milestone.id) }
    catch (e: any) { setErr(e.response?.data?.detail ?? 'Failed to release payment') }
    finally { setLoading(null) }
  }

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-3 transition-colors',
      meta.bg, meta.border,
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('p-1.5 rounded-lg', meta.bg)}>
            <Icon className={cn('h-4 w-4', meta.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{milestone.title}</p>
            <p className={cn('text-[10px] font-medium uppercase tracking-wider', meta.color)}>
              {meta.label}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{formatCurrency(milestone.amount)}</p>
          {payment && (
            <p className="text-[10px] text-muted-foreground">
              {formatCurrency(payment.net_amount)} to freelancer
            </p>
          )}
        </div>
      </div>

      {/* Funded / released dates */}
      {payment?.escrow_funded_at && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Funded {formatDate(payment.escrow_funded_at)}</span>
          {payment.released_at && (
            <span>Released {formatDate(payment.released_at)}</span>
          )}
        </div>
      )}

      {/* Actions */}
      {isClient && (canFund || canRelease) && (
        <div className="flex gap-2">
          {canFund && (
            <button
              disabled={!!loading}
              onClick={handleFund}
              className="flex-1 py-2 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading === 'fund'
                ? <><Loader2 className="h-3 w-3 animate-spin" />Funding…</>
                : <><Lock className="h-3 w-3" />Fund Escrow</>}
            </button>
          )}
          {canRelease && (
            <button
              disabled={!!loading}
              onClick={handleRelease}
              className="flex-1 py-2 rounded-lg text-xs font-medium bg-gradient-brand text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading === 'release'
                ? <><Loader2 className="h-3 w-3 animate-spin" />Releasing…</>
                : <><Unlock className="h-3 w-3" />Release Payment</>}
            </button>
          )}
        </div>
      )}

      {err && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />{err}
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function EscrowPanel({ contract, milestones }: EscrowPanelProps) {
  const { user }       = useAuthStore()
  const { escrowMap, fetchHistory, fundEscrow, release } = usePaymentStore()
  const [useMock, setUseMock] = useState(false)

  const isClient = contract.client_id === user?.id

  useEffect(() => {
    fetchHistory().catch(() => setUseMock(true))
  }, [fetchHistory])

  if (milestones.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-surface-3 p-6 text-center">
        <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
        <p className="text-sm text-muted-foreground">No milestones to show escrow for</p>
      </div>
    )
  }

  const totalFunded   = milestones.reduce((s, m) => {
    const p = escrowMap[m.id] ?? (useMock ? buildMockPayment(m) : null)
    return s + (p?.status === 'processing' ? p.gross_amount : 0)
  }, 0)
  const totalReleased = milestones.reduce((s, m) => {
    const p = escrowMap[m.id] ?? (useMock ? buildMockPayment(m) : null)
    return s + (p?.status === 'completed' ? p.gross_amount : 0)
  }, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'In Escrow',      value: totalFunded,   icon: Lock,   color: 'text-blue-400' },
          { label: 'Released',       value: totalReleased, icon: Unlock, color: 'text-brand-400' },
        ].map(({ label, value, icon: Ic, color }) => (
          <div key={label} className="bg-surface-3 border border-white/[0.05] rounded-xl p-4 text-center">
            <Ic className={cn('h-4 w-4 mx-auto mb-1', color)} />
            <p className={cn('text-lg font-bold', color)}>{formatCurrency(value)}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-milestone rows */}
      <div className="space-y-3">
        {milestones.map((m, i) => {
          const payment = escrowMap[m.id] ?? (useMock ? buildMockPayment(m) : null)
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <EscrowRow
                milestone={m}
                payment={payment}
                isClient={isClient}
                onFund={fundEscrow}
                onRelease={release}
              />
            </motion.div>
          )
        })}
      </div>

      {isClient && (
        <p className="text-[10px] text-muted-foreground text-center">
          <ShieldCheck className="h-3 w-3 inline mr-1 opacity-60" />
          Funds are held in escrow until you approve the milestone and release payment.
        </p>
      )}
    </div>
  )
}
