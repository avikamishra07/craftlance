import { create } from 'zustand'
import type { Contract, ContractStatus, Milestone, MilestoneStatus, Message } from '@/types'
import {
  contractsApi,
  milestonesApi,
  messagesApi,
  type MilestoneCreatePayload,
  type MilestoneStatusPayload,
} from '@/api/contracts'

interface ContractStore {
  // My contracts list
  contracts: Contract[]
  contractsLoading: boolean
  fetchContracts: () => Promise<void>

  // Active workspace
  activeContract: Contract | null
  activeContractLoading: boolean
  fetchContract: (id: string) => Promise<void>
  clearActiveContract: () => void
  updateContractStatus: (id: string, status: ContractStatus, reason?: string) => Promise<void>

  // Milestones for active contract
  milestones: Milestone[]
  milestonesLoading: boolean
  fetchMilestones: (contractId: string) => Promise<void>
  addMilestone: (contractId: string, payload: MilestoneCreatePayload) => Promise<Milestone>
  updateMilestoneStatus: (milestoneId: string, payload: MilestoneStatusPayload) => Promise<void>

  // Messages for active contract
  messages: Message[]
  messagesLoading: boolean
  fetchMessages: (contractId: string) => Promise<void>
  sendMessage: (contractId: string, content: string, fileUrls?: string[]) => Promise<void>
}

export const useContractStore = create<ContractStore>((set, get) => ({
  // ── Contracts list ──────────────────────────────────────────────────────────
  contracts: [],
  contractsLoading: false,

  fetchContracts: async () => {
    set({ contractsLoading: true })
    try {
      const contracts = await contractsApi.list()
      set({ contracts, contractsLoading: false })
    } catch {
      set({ contractsLoading: false })
    }
  },

  // ── Active workspace ────────────────────────────────────────────────────────
  activeContract: null,
  activeContractLoading: false,

  fetchContract: async (id) => {
    set({ activeContractLoading: true })
    try {
      const contract = await contractsApi.get(id)
      set({ activeContract: contract, activeContractLoading: false })
    } catch {
      set({ activeContractLoading: false })
    }
  },

  clearActiveContract: () => set({ activeContract: null, milestones: [], messages: [] }),

  updateContractStatus: async (id, status, reason) => {
    const updated = await contractsApi.updateStatus(id, status, reason)
    set((s) => ({
      activeContract: s.activeContract?.id === id ? updated : s.activeContract,
      contracts: s.contracts.map((c) => (c.id === id ? updated : c)),
    }))
  },

  // ── Milestones ──────────────────────────────────────────────────────────────
  milestones: [],
  milestonesLoading: false,

  fetchMilestones: async (contractId) => {
    set({ milestonesLoading: true })
    try {
      const milestones = await milestonesApi.list(contractId)
      set({ milestones, milestonesLoading: false })
    } catch {
      set({ milestonesLoading: false })
    }
  },

  addMilestone: async (contractId, payload) => {
    const milestone = await milestonesApi.add(contractId, payload)
    set((s) => ({
      milestones: [...s.milestones, milestone].sort((a, b) => a.order_index - b.order_index),
    }))
    return milestone
  },

  updateMilestoneStatus: async (milestoneId, payload) => {
    const updated = await milestonesApi.updateStatus(milestoneId, payload)
    set((s) => ({
      milestones: s.milestones.map((m) => (m.id === milestoneId ? updated : m)),
    }))
  },

  // ── Messages ────────────────────────────────────────────────────────────────
  messages: [],
  messagesLoading: false,

  fetchMessages: async (contractId) => {
    set({ messagesLoading: true })
    try {
      const messages = await messagesApi.list(contractId)
      set({ messages, messagesLoading: false })
    } catch {
      set({ messagesLoading: false })
    }
  },

  sendMessage: async (contractId, content, fileUrls) => {
    const message = await messagesApi.send(contractId, content, fileUrls)
    set((s) => ({ messages: [...s.messages, message] }))
  },
}))
