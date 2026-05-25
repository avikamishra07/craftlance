/**
 * PaymentHistory.tsx — M5
 * /dashboard/payments
 * Transaction list: amount, status, date, counterparty.
 * Works for both clients (payments made) and freelancers (payments received).
 */
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard, ArrowUpRight, ArrowDownLeft,
  Clock, CheckCircle2, AlertCircle, RotateCcw, Loader2,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Payment, PaymentStatus } from '@/types'
import { usePaymentStore } from '@/store/paymentStore'
import { useAuthStore } from '@/store/authStore'

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'm1', milestone_id: 'ms1', contract_id: 'c1',
    payer_id: 'client-1', payee_id: 'freelancer-1',
    gross_amount: 1500, platform_fee: 150, net_amount: 1350,
    status: 'completed',
    escrow_funded_at: '2025-03-01T10:00:00Z',
    released_at: '2025-03-15T14:00:00Z',
    created_at: '2025-03-01T10:00:00Z',
    payer: { id: 'client-1', full_name: 'Acme Corp', avatar_url: undefined },
    payee: { id: 'freelancer-1', full_name: 'Alex Rivera', avatar_url: undefined },
  },
  {
    id: 'm2', milestone_id: 'ms2', contract_id: 'c1',
    payer_id: 'client-1', payee_id: 'freelancer-1',
    gross_amount: 2500, platform_fee: 250, net_amount: 2250,
    status: 'processing',
    escrow_funded_at: '2025-03-20T09:00:00Z',
    created_at: '2025-03-20T09:00:00Z',
    payer: { id: 'client-1', full_name: 'Acme Corp', avatar_url: undefined },
    payee: { id: 'freelancer-1', full_name: 'Alex Rivera', avatar_url: undefined },
  },
  {
    id: 'm3', milestone_id: 'ms3', contract_id: 'c2',
    payer_id: 'client-2', payee_id: 'freelancer-1',
    gross_amount: 800, platform_fee: 80, net_amount: 720,
    status: 'completed',
    escrow_funded_at: '2025-02-10T08:00:00Z',
    released_at: '2025-02-18T16:00:00Z',
    created_at: '2025-02-10T08:00:00Z',
    payer: { id: 'client-2', full_name: 'StartupXYZ', avatar_url: undefined },
    payee: { id: 'freelancer-1', full_name: 'Alex Rivera', avatar_url: undefined },
  },
  {
    id: 'm4', milestone_id: 'ms4', contract_id: 'c3',
    payer_id: 'client-3', payee_id: 'freelancer-1',
    gross_amount: 3200, platform_fee: 320, net_amount: 2880,
    status: 'pending',
    created_at: '2025-03-25T12:00:00Z',
    payer: { id: 'client-3', full_name: 'TechFlow Inc', avatar_url: undefined },
    payee: { id: 'freelancer-1', full_name: 'Alex Rivera', avatar_url: undefined },
  },
]

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<PaymentStatus, {
  label: string
  icon: React.ElementType
  color: string
  bg: string
}> = {
  pending:    { label: 'Pending',    icon: Clock,        color: 'text-muted-foreground', bg: 'bg-surface-3' },
  processing: { label: 'In Escrow', icon: Clock,        color: 'text-blue-400',         bg: 'bg-blue-500/10' },
  completed:  { label: 'Completed', icon: CheckCircle2, color: 'text-green-400',        bg: 'bg-green-500/10' },
  failed:     { label: 'Failed',    icon: AlertCircle,  color: 'text-red-400',          bg: 'bg-red-500/10' },
  refunded:   { label: 'Refunded',  icon: RotateCcw,    color: 'text-yellow-400',       bg: 'bg-yellow-500/10' },
}

// ── Payment row ───────────────────────────────────────────────────────────────
function PaymentRow({ payment, userId }: { payment: Payment; userId: string }) {
  const isOutgoing = payment.payer_id === userId
  const cfg = STATUS_CFG[payment.status]
  const Icon = cfg.icon
  const counterparty = isOutgoing ? payment.payee : payment.payer
  const initials = counterparty?.full_name
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??'

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-3 border border-white/[0.05] hover:border-white/[0.1] transition-colors">
      {/* Direction icon */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
        isOutgoing ? 'bg-red-500/10' : 'bg-green-500/10',
      )}>
        {isOutgoing
          ? <ArrowUpRight className="h-5 w-5 text-red-400" />
          : <ArrowDownLeft className="h-5 w-5 text-green-400" />}
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-[10px] font-bold text-white shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {isOutgoing ? 'Paid to' : 'Received from'} {counterparty?.full_name ?? 'Unknown'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(payment.released_at ?? payment.escrow_funded_at ?? payment.created_at)}
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div className={cn('hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium', cfg.bg, cfg.color)}>
        <Icon className="h-2.5 w-2.5" />
        {cfg.label}
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={cn('text-sm font-semibold', isOutgoing ? 'text-red-400' : 'text-green-400')}>
          {isOutgoing ? '-' : '+'}{formatCurrency(isOutgoing ? payment.gross_amount : payment.net_amount)}
        </p>
        {isOutgoing && (
          <p className="text-[10px] text-muted-foreground">
            incl. {formatCurrency(payment.platform_fee)} fee
          </p>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PaymentHistory() {
  const { user }                   = useAuthStore()
  const { history, historyLoading, fetchHistory } = usePaymentStore()

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const payments = historyLoading ? [] : (history.length > 0 ? history : MOCK_PAYMENTS)
  const userId   = user?.id ?? 'freelancer-1'

  const totalIn  = payments.filter((p) => p.payee_id === userId && p.status === 'completed')
    .reduce((s, p) => s + p.net_amount, 0)
  const totalOut = payments.filter((p) => p.payer_id === userId && p.status === 'completed')
    .reduce((s, p) => s + p.gross_amount, 0)
  const inEscrow = payments.filter((p) => p.status === 'processing')
    .reduce((s, p) => s + p.gross_amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Payment History</h1>
        <p className="text-muted-foreground text-sm mt-1">All your transactions — sent and received</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Received', value: totalIn,  color: 'text-green-400', icon: ArrowDownLeft },
          { label: 'Total Paid',     value: totalOut, color: 'text-red-400',   icon: ArrowUpRight },
          { label: 'In Escrow',      value: inEscrow, color: 'text-blue-400',  icon: Clock },
        ].map(({ label, value, color, icon: Ic }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-surface-2 border border-white/[0.06] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <Ic className={cn('h-4 w-4', color)} />
            </div>
            <p className={cn('text-2xl font-bold', color)}>{formatCurrency(value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Transactions */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">Transactions</h2>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 bg-surface-3 rounded-2xl border border-white/[0.05]">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <PaymentRow payment={p} userId={userId} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
