import { api } from './client'
import type {
  Project, ProjectType, ProjectStatus,
  PaginatedResponse, CreateProjectPayload, UpdateProjectPayload,
} from '@/types'

export interface ProjectFilters {
  q?: string
  skills?: string          // comma-separated
  project_type?: ProjectType
  budget_min?: number
  budget_max?: number
  status?: ProjectStatus | 'all'
  page?: number
  page_size?: number
}

export const projectsApi = {
  /** Browse / search open projects */
  list: async (filters: ProjectFilters = {}): Promise<PaginatedResponse<Project>> => {
    const params = new URLSearchParams()
    if (filters.q)            params.set('q', filters.q)
    if (filters.skills)       params.set('skills', filters.skills)
    if (filters.project_type) params.set('project_type', filters.project_type)
    if (filters.budget_min != null) params.set('budget_min', String(filters.budget_min))
    if (filters.budget_max != null) params.set('budget_max', String(filters.budget_max))
    if (filters.status)       params.set('status', filters.status)
    params.set('page',      String(filters.page      ?? 1))
    params.set('page_size', String(filters.page_size ?? 20))

    const { data } = await api.get<PaginatedResponse<Project>>(`/projects?${params}`)
    return data
  },

  /** Client's own projects */
  mine: async (): Promise<Project[]> => {
    const { data } = await api.get<Project[]>('/projects/mine')
    return data
  },

  /** Single project by id */
  get: async (id: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/projects/${id}`)
    return data
  },

  /** Post a new project (client) */
  create: async (payload: CreateProjectPayload): Promise<Project> => {
    const { data } = await api.post<Project>('/projects', payload)
    return data
  },

  /** Edit project fields */
  update: async (id: string, payload: UpdateProjectPayload): Promise<Project> => {
    const { data } = await api.patch<Project>(`/projects/${id}`, payload)
    return data
  },

  /** Delete project */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`)
  },
}
