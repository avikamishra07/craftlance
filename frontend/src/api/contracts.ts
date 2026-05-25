import { api } from './client'
import type {
  Contract, ContractStatus,
  Milestone, MilestoneStatus,
  Message,
} from '@/types'

// ── Contracts ─────────────────────────────────────────────────────────────────

export const contractsApi = {
  /** All contracts I'm party to (client or freelancer) */
  list: async (): Promise<Contract[]> => {
    const { data } = await api.get<Contract[]>('/contracts')
    return data
  },

  /** Single contract detail */
  get: async (id: string): Promise<Contract> => {
    const { data } = await api.get<Contract>(`/contracts/${id}`)
    return data
  },

  /** Create contract from accepted proposal (client) */
  create: async (proposalId: string): Promise<Contract> => {
    const { data } = await api.post<Contract>('/contracts', null, {
      params: { proposal_id: proposalId },
    })
    return data
  },

  /** Update contract status */
  updateStatus: async (
    id: string,
    status: ContractStatus,
    reason?: string,
  ): Promise<Contract> => {
    const { data } = await api.patch<Contract>(`/contracts/${id}/status`, { status, reason })
    return data
  },
}

// ── Milestones ────────────────────────────────────────────────────────────────

export interface MilestoneCreatePayload {
  title: string
  description?: string
  amount: number
  due_date?: string
  order_index?: number
}

export interface MilestoneStatusPayload {
  status: MilestoneStatus
  revision_note?: string
  deliverable_urls?: string[]
}

export const milestonesApi = {
  list: async (contractId: string): Promise<Milestone[]> => {
    const { data } = await api.get<Milestone[]>(`/contracts/${contractId}/milestones`)
    return data
  },

  add: async (contractId: string, payload: MilestoneCreatePayload): Promise<Milestone> => {
    const { data } = await api.post<Milestone>(`/contracts/${contractId}/milestones`, payload)
    return data
  },

  updateStatus: async (milestoneId: string, payload: MilestoneStatusPayload): Promise<Milestone> => {
    const { data } = await api.patch<Milestone>(`/milestones/${milestoneId}`, payload)
    return data
  },
}

// ── Messages ──────────────────────────────────────────────────────────────────

export const messagesApi = {
  list: async (contractId: string): Promise<Message[]> => {
    const { data } = await api.get<Message[]>(`/contracts/${contractId}/messages`)
    return data
  },

  send: async (contractId: string, content: string, fileUrls?: string[]): Promise<Message> => {
    const { data } = await api.post<Message>(`/contracts/${contractId}/messages`, {
      content,
      file_urls: fileUrls,
    })
    return data
  },
}
