/**
 * EarningsSummary.tsx — M5
 * /dashboard/earnings
 * Freelancer earnings: total earned, pending, recharts area chart over time.
 */
import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, DollarSign, Clock, Wallet,
  ArrowUpRight, Loader2,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { usePaymentStore } from '@/store/paymentStore'
import { useAuthStore } from '@/store/authStore'

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_CHART = [
  { month: 'Oct', earnings: 0 },
  { month: 'Nov', earnings: 800 },
  { month: 'Dec', earnings: 1500 },
  { month: 'Jan', earnings: 2200 },
  { month: 'Feb', earnings: 1800 },
  { month: 'Mar', earnings: 3500 },
]

const MOCK_BALANCE = {
  pending_amount: 2500,
  available_amount: 4350,
  total_earned: 6850,
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-white/[0.1] rounded-xl p-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-brand-400">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EarningsSummary() {
  const { user }                                   = useAuthStore()
  const { balance, balanceLoading, fetchBalance, history, historyLoading, fetchHistory } = usePaymentStore()

  useEffect(() => {
    fetchBalance()
    fetchHistory()
  }, [fetchBalance, fetchHistory])

  const bal = balance ?? MOCK_BALANCE

  // Build chart data from payment history (group by month)
  const chartData = useMemo(() => {
    const userId = user?.id ?? ''
    const completed = history.filter(
      (p) => p.payee_id === userId && p.status === 'completed' && p.released_at,
    )

    if (completed.length === 0) return MOCK_CHART

    const byMonth: Record<string, number> = {}
    for (const p of completed) {
      const d = new Date(p.released_at!)
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      byMonth[key] = (byMonth[key] ?? 0) + p.net_amount
    }

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, earnings]) => ({ month, earnings }))
  }, [history, user?.id])

  const growth = chartData.length >= 2
    ? ((chartData.at(-1)!.earnings - chartData.at(-2)!.earnings) / (chartData.at(-2)!.earnings || 1)) * 100
    : 0

  const isLoading = balanceLoading || historyLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground text-sm mt-1">Your freelancing income at a glance</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Earned',
                value: bal.total_earned,
                icon: DollarSign,
                color: 'text-brand-400',
                bg: 'bg-brand-500/10',
                desc: 'Lifetime net earnings',
              },
              {
                label: 'Available',
                value: bal.available_amount,
                icon: Wallet,
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                desc: 'Ready to withdraw',
              },
              {
                label: 'Pending Escrow',
                value: bal.pending_amount,
                icon: Clock,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                desc: 'Waiting for release',
              },
            ].map(({ label, value, icon: Ic, color, bg, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-surface-2 border border-white/[0.06] rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <div className={cn('p-2 rounded-lg', bg)}>
                    <Ic className={cn('h-4 w-4', color)} />
                  </div>
                </div>
                <p className={cn('text-3xl font-bold', color)}>{formatCurrency(value)}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-surface-2 border border-white/[0.06] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold">Earnings Over Time</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly net income</p>
              </div>
              {growth !== 0 && (
                <div className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                  growth >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400',
                )}>
                  <ArrowUpRight className={cn('h-3.5 w-3.5', growth < 0 && 'rotate-180')} />
                  {Math.abs(growth).toFixed(0)}% vs last month
                </div>
              )}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'rgb(148 163 184)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgb(148 163 184)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={36}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#earningsGrad)"
                  dot={{ fill: '#7c3aed', strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: '#a78bfa', strokeWidth: 0, r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Growth tip */}
          {bal.total_earned === 0 && (
            <div className="bg-surface-3 border border-white/[0.06] rounded-2xl p-5 flex items-start gap-4">
              <TrendingUp className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Start earning on Craftlance</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Browse open projects and submit proposals to get your first contract.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
