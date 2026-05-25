import { create } from 'zustand'
import type {
  Project, Proposal, ProjectStatus, ProposalStatus,
  CreateProjectPayload, UpdateProjectPayload,
  SubmitProposalPayload, PaginatedResponse,
} from '@/types'
import { projectsApi, type ProjectFilters } from '@/api/projects'
import { proposalsApi } from '@/api/proposals'

// ── Browse slice ──────────────────────────────────────────────────────────────
interface BrowseState {
  projects: Project[]
  total: number
  page: number
  hasNext: boolean
  hasPrev: boolean
  filters: ProjectFilters
  isLoading: boolean
  error: string | null
}

// ── Store ─────────────────────────────────────────────────────────────────────
interface ProjectStore {
  // Browse
  browse: BrowseState
  setFilters: (filters: Partial<ProjectFilters>) => void
  fetchProjects: (filters?: Partial<ProjectFilters>) => Promise<void>
  nextPage: () => void
  prevPage: () => void

  // Active project detail
  activeProject: Project | null
  activeProjectLoading: boolean
  fetchProject: (id: string) => Promise<void>
  clearActiveProject: () => void

  // My projects (client)
  myProjects: Project[]
  myProjectsLoading: boolean
  fetchMyProjects: () => Promise<void>

  // Proposals on active project (client)
  projectProposals: Proposal[]
  projectProposalsLoading: boolean
  fetchProjectProposals: (projectId: string) => Promise<void>
  updateProposalStatus: (proposalId: string, status: ProposalStatus) => Promise<void>

  // My proposals (freelancer)
  myProposals: Proposal[]
  myProposalsLoading: boolean
  fetchMyProposals: () => Promise<void>

  // CRUD
  createProject: (payload: CreateProjectPayload) => Promise<Project>
  updateProject: (id: string, payload: UpdateProjectPayload) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  submitProposal: (projectId: string, payload: SubmitProposalPayload) => Promise<Proposal>
}

const DEFAULT_FILTERS: ProjectFilters = {
  status: 'open',
  page: 1,
  page_size: 20,
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // ── Browse ──────────────────────────────────────────────────────────────────
  browse: {
    projects: [],
    total: 0,
    page: 1,
    hasNext: false,
    hasPrev: false,
    filters: DEFAULT_FILTERS,
    isLoading: false,
    error: null,
  },

  setFilters: (newFilters) => {
    set((s) => ({
      browse: {
        ...s.browse,
        filters: { ...s.browse.filters, ...newFilters, page: 1 },
      },
    }))
  },

  fetchProjects: async (override) => {
    const filters = { ...get().browse.filters, ...override }
    set((s) => ({ browse: { ...s.browse, isLoading: true, error: null } }))
    try {
      const res: PaginatedResponse<Project> = await projectsApi.list(filters)
      set((s) => ({
        browse: {
          ...s.browse,
          projects: res.items,
          total: res.total,
          page: res.page,
          hasNext: res.has_next,
          hasPrev: res.has_prev,
          filters,
          isLoading: false,
        },
      }))
    } catch (err: any) {
      set((s) => ({
        browse: {
          ...s.browse,
          isLoading: false,
          error: err.response?.data?.detail ?? 'Failed to load projects',
        },
      }))
    }
  },

  nextPage: () => {
    const { browse, fetchProjects } = get()
    if (browse.hasNext) {
      fetchProjects({ ...browse.filters, page: browse.page + 1 })
    }
  },

  prevPage: () => {
    const { browse, fetchProjects } = get()
    if (browse.hasPrev) {
      fetchProjects({ ...browse.filters, page: browse.page - 1 })
    }
  },

  // ── Active project ──────────────────────────────────────────────────────────
  activeProject: null,
  activeProjectLoading: false,

  fetchProject: async (id) => {
    set({ activeProjectLoading: true })
    try {
      const project = await projectsApi.get(id)
      set({ activeProject: project, activeProjectLoading: false })
    } catch {
      set({ activeProjectLoading: false })
    }
  },

  clearActiveProject: () => set({ activeProject: null }),

  // ── My projects ─────────────────────────────────────────────────────────────
  myProjects: [],
  myProjectsLoading: false,

  fetchMyProjects: async () => {
    set({ myProjectsLoading: true })
    try {
      const projects = await projectsApi.mine()
      set({ myProjects: projects, myProjectsLoading: false })
    } catch {
      set({ myProjectsLoading: false })
    }
  },

  // ── Project proposals ───────────────────────────────────────────────────────
  projectProposals: [],
  projectProposalsLoading: false,

  fetchProjectProposals: async (projectId) => {
    set({ projectProposalsLoading: true })
    try {
      const proposals = await proposalsApi.listForProject(projectId)
      set({ projectProposals: proposals, projectProposalsLoading: false })
    } catch {
      set({ projectProposalsLoading: false })
    }
  },

  updateProposalStatus: async (proposalId, status) => {
    const updated = await proposalsApi.updateStatus(proposalId, status)
    set((s) => ({
      projectProposals: s.projectProposals.map((p) =>
        p.id === proposalId ? updated : p,
      ),
      myProposals: s.myProposals.map((p) =>
        p.id === proposalId ? updated : p,
      ),
    }))
  },

  // ── My proposals ────────────────────────────────────────────────────────────
  myProposals: [],
  myProposalsLoading: false,

  fetchMyProposals: async () => {
    set({ myProposalsLoading: true })
    try {
      const proposals = await proposalsApi.mine()
      set({ myProposals: proposals, myProposalsLoading: false })
    } catch {
      set({ myProposalsLoading: false })
    }
  },

  // ── CRUD ────────────────────────────────────────────────────────────────────
  createProject: async (payload) => {
    const project = await projectsApi.create(payload)
    set((s) => ({ myProjects: [project, ...s.myProjects] }))
    return project
  },

  updateProject: async (id, payload) => {
    const updated = await projectsApi.update(id, payload)
    set((s) => ({
      myProjects: s.myProjects.map((p) => (p.id === id ? updated : p)),
      activeProject: s.activeProject?.id === id ? updated : s.activeProject,
    }))
    return updated
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id)
    set((s) => ({
      myProjects: s.myProjects.filter((p) => p.id !== id),
      browse: {
        ...s.browse,
        projects: s.browse.projects.filter((p) => p.id !== id),
      },
    }))
  },

  submitProposal: async (projectId, payload) => {
    const proposal = await proposalsApi.submit(projectId, payload)
    set((s) => ({ myProposals: [proposal, ...s.myProposals] }))
    return proposal
  },
}))
