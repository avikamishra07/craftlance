import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Briefcase, Layers, AlertCircle, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import { useContractStore } from '@/store/contractStore'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ContractCard } from '@/components/workspace/ContractCard'
import type { ProjectStatus } from '@/types'

const PROJECT_TABS: { key: ProjectStatus | 'all'; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'draft',       label: 'Drafts' },
  { key: 'completed',   label: 'Completed' },
]

type View = 'projects' | 'contracts'

export default function MyProjects() {
  const navigate = useNavigate()
  const { myProjects, myProjectsLoading, fetchMyProjects, deleteProject } = useProjectStore()
  const { contracts, contractsLoading, fetchContracts } = useContractStore()

  const [view, setView]         = useState<View>('projects')
  const [statusTab, setStatusTab] = useState<ProjectStatus | 'all'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMyProjects()
    fetchContracts()
  }, [])

  const filteredProjects = statusTab === 'all'
    ? myProjects
    : myProjects.filter((p) => p.status === statusTab)

  const projectCounts = PROJECT_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all'
      ? myProjects.length
      : myProjects.filter((p) => p.status === t.key).length
    return acc
  }, {} as Record<string, number>)

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return
    setDeletingId(id)
    try { await deleteProject(id) }
    finally { setDeletingId(null) }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your posted projects and active contracts</p>
        </div>
        <Link to="/projects/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-brand text-white hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Post a Project
        </Link>
      </motion.div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl border border-white/[0.05] w-fit">
        {([
          { key: 'projects',  label: 'Projects',  icon: Briefcase, count: myProjects.length },
          { key: 'contracts', label: 'Contracts',  icon: Layers,    count: contracts.length },
        ] as const).map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setView(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
              view === key
                ? 'bg-surface-4 text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && (
              <span className={cn('text-[10px] font-medium px-1.5 rounded-full',
                view === key ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-3 text-muted-foreground')}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Projects view */}
      {view === 'projects' && (
        <>
          {/* Status filter tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {PROJECT_TABS.map((t) => (
              <button key={t.key} onClick={() => setStatusTab(t.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-all',
                  statusTab === t.key
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
                    : 'bg-surface-2 border-white/[0.06] text-muted-foreground hover:text-foreground',
                )}>
                {t.label}
                {projectCounts[t.key] > 0 && (
                  <span className="ml-1.5 text-[10px]">({projectCounts[t.key]})</span>
                )}
              </button>
            ))}
          </div>

          {myProjectsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center mb-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm">
                {statusTab === 'all' ? 'No projects yet' : `No ${statusTab.replace('_', ' ')} projects`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusTab === 'all' ? 'Post your first project to start hiring' : 'Try a different filter'}
              </p>
              {statusTab === 'all' && (
                <Link to="/projects/new"
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-brand text-white hover:opacity-90 transition-opacity">
                  Post a Project
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map((project, i) => (
                <div key={project.id} className="relative">
                  {deletingId === project.id && (
                    <div className="absolute inset-0 bg-surface-1/80 rounded-2xl z-10 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />
                    </div>
                  )}
                  <ProjectCard
                    project={project}
                    index={i}
                    variant="manage"
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Contracts view */}
      {view === 'contracts' && (
        <>
          {contractsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center mb-3">
                <Layers className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm">No active contracts</p>
              <p className="text-xs text-muted-foreground mt-1">Accept a proposal to start a contract</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {contracts.map((contract, i) => (
                <ContractCard key={contract.id} contract={contract} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
