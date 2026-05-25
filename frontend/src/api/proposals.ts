import { api } from './client'
import type { Proposal, ProposalStatus, SubmitProposalPayload } from '@/types'

export const proposalsApi = {
  /** Submit a new proposal (freelancer) */
  submit: async (projectId: string, payload: SubmitProposalPayload): Promise<Proposal> => {
    const { data } = await api.post<Proposal>(
      `/projects/${projectId}/proposals`,
      payload,
    )
    return data
  },

  /** List all proposals on a project (client/owner only) */
  listForProject: async (projectId: string): Promise<Proposal[]> => {
    const { data } = await api.get<Proposal[]>(`/projects/${projectId}/proposals`)
    return data
  },

  /** All proposals submitted by the current freelancer */
  mine: async (): Promise<Proposal[]> => {
    const { data } = await api.get<Proposal[]>('/proposals/mine')
    return data
  },

  /** Single proposal detail */
  get: async (proposalId: string): Promise<Proposal> => {
    const { data } = await api.get<Proposal>(`/proposals/${proposalId}`)
    return data
  },

  /** Change status: shortlist / accept / reject / withdraw */
  updateStatus: async (
    proposalId: string,
    status: ProposalStatus,
  ): Promise<Proposal> => {
    const { data } = await api.patch<Proposal>(`/proposals/${proposalId}`, { status })
    return data
  },
}
