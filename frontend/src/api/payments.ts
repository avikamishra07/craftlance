import { api } from './client'
import type { Payment, Balance } from '@/types'

export const paymentsApi = {
  /** Client funds escrow for a milestone */
  fundEscrow: async (milestoneId: string, notes?: string): Promise<Payment> => {
    const { data } = await api.post<Payment>('/payments/fund-escrow', {
      milestone_id: milestoneId,
      notes,
    })
    return data
  },

  /** Client releases escrowed payment to freelancer */
  release: async (milestoneId: string): Promise<Payment> => {
    const { data } = await api.post<Payment>(`/payments/release/${milestoneId}`)
    return data
  },

  /** Full payment history for current user */
  history: async (): Promise<Payment[]> => {
    const { data } = await api.get<Payment[]>('/payments/history')
    return data
  },

  /** Freelancer balance */
  balance: async (): Promise<Balance> => {
    const { data } = await api.get<Balance>('/payments/balance')
    return data
  },
}
