import { create } from 'zustand'
import type { Payment, Balance } from '@/types'
import { paymentsApi } from '@/api/payments'

interface PaymentStore {
  // History
  history: Payment[]
  historyLoading: boolean
  fetchHistory: () => Promise<void>

  // Balance (freelancer)
  balance: Balance | null
  balanceLoading: boolean
  fetchBalance: () => Promise<void>

  // Per-milestone escrow map  milestoneId → Payment
  escrowMap: Record<string, Payment>
  setEscrow: (payment: Payment) => void

  // Actions
  fundEscrow: (milestoneId: string, notes?: string) => Promise<Payment>
  release: (milestoneId: string) => Promise<Payment>
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  // ── History ────────────────────────────────────────────────────────────────
  history: [],
  historyLoading: false,

  fetchHistory: async () => {
    set({ historyLoading: true })
    try {
      const history = await paymentsApi.history()
      // Build escrow map while we're at it
      const escrowMap: Record<string, Payment> = {}
      for (const p of history) {
        escrowMap[p.milestone_id] = p
      }
      set({ history, historyLoading: false, escrowMap })
    } catch {
      set({ historyLoading: false })
    }
  },

  // ── Balance ────────────────────────────────────────────────────────────────
  balance: null,
  balanceLoading: false,

  fetchBalance: async () => {
    set({ balanceLoading: true })
    try {
      const balance = await paymentsApi.balance()
      set({ balance, balanceLoading: false })
    } catch {
      set({ balanceLoading: false })
    }
  },

  // ── Escrow map ─────────────────────────────────────────────────────────────
  escrowMap: {},

  setEscrow: (payment) =>
    set((s) => ({
      escrowMap: { ...s.escrowMap, [payment.milestone_id]: payment },
    })),

  // ── Fund escrow ────────────────────────────────────────────────────────────
  fundEscrow: async (milestoneId, notes) => {
    const payment = await paymentsApi.fundEscrow(milestoneId, notes)
    get().setEscrow(payment)
    return payment
  },

  // ── Release payment ────────────────────────────────────────────────────────
  release: async (milestoneId) => {
    const payment = await paymentsApi.release(milestoneId)
    get().setEscrow(payment)
    // Update history list if loaded
    set((s) => ({
      history: s.history.map((p) => (p.milestone_id === milestoneId ? payment : p)),
    }))
    return payment
  },
}))
