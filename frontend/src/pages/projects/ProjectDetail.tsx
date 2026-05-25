import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar, DollarSign, Clock, Users, Eye, ArrowLeft,
  Bookmark, Share2, CheckCircle, Edit, Trash2,
  Loader2, AlertTriangle, Tag, Zap,
} from 'lucide-react'
import { cn, formatCurrency, formatDate, timeAgo } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import { ProposalForm } from '@/components/projects/ProposalForm'
import { ProposalCard } from '@/components/projects/ProposalCard'

const MOCK_PROPOSALS = [
  {
    id: 'mock-1', project_id: '', freelancer_id: 'fl-1',
    bid_amount: 1800, timeline_days: 21, status: 'pending' as const,
    cover_letter: 'I have 5 years of experience building exactly this type of application. My recent work includes a very similar SaaS dashboard for a fintech startup where I delivered ahead of schedule. I would approach this by first setting up the core data models, then building the API layer, and finally the React frontend with your design system. I am confident I can deliver this within your budget and timeline.',
    ai_score: 87, ai_clarity_score: 90, ai_relevance_score: 85, ai_professionalism_score: 88, ai_value_score: 82,
    ai_feedback: 'Strong proposal with relevant experience. Cover letter directly addresses the project requirements.',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    freelancer: { id: 'fl-1', full_name: 'Alex Chen', title: 'Full-Stack Engineer', location: 'San Francisco, CA', hourly_rate: 95, reputation_score: 4.9, total_projects: 34, is_verified: true, skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'] },
  },
  {
    id: 'mock-2', project_id: '', freelancer_id: 'fl-2',
    bid_amount: 2400, timeline_days: 14, status: 'shortlisted' as const,
    cover_letter: 'As a senior React developer with extensive FastAPI experience, I can deliver a premium dashboard that exceeds your expectations. I have built 12+ SaaS products and understand the nuances of scalable architecture. My approach combines clean code with exceptional UX — check my portfolio for live examples. I can start immediately.',
    ai_score: 91, ai_clarity_score: 94, ai_relevance_score: 92, ai_professionalism_score: 95, ai_value_score: 82,
    ai_feedback: 'Excellent proposal. High confidence, clear approach, portfolio evidence.',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    freelancer: { id: 'fl-2', full_name: 'Sarah Kim', title: 'Senior React Developer', location: 'New York, NY', hourly_rate: 120, reputation_score: 5.0, total_projects: 67, is_verified: true, skills: ['React', 'FastAPI', 'AWS', 'Figma'] },
  },
  {
    id: 'mock-3', project_id: '', freelancer_id: 'fl-3',
    bid_amount: 1200, timeline_days: 30, status: 'pending' as const,
    cover_letter: 'I can do this project. I have experience with React and Python. Please check my profile for my previous work. I am available to start right away and will deliver good quality work within the deadline you have set.',
    ai_score: 42, ai_clarity_score: 35, ai_relevance_score: 48, ai_professionalism_score: 40, ai_value_score: 52,
    ai_feedback: 'Generic cover letter. Does not address project specifics or demonstrate relevant experience.',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    freelancer: { id: 'fl-3', full_name: 'James T.', title: 'Web Developer', location: 'Remote', hourly_rate: 45, reputation_score: 3.8, total_projects: 8, is_verified: false, skills: ['React', 'Python'] },
  },
]

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    activeProject, activeProjectLoading, fetchProject, clearActiveProject,
    projectProposals, projectProposalsLoading, fetchProjectProposals, deleteProject,
  } = useProjectStore()

  const [proposalFormOpen, setProposalFormOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm]       = useState(false)
  const [deleting, setDeleting]                 = useState(false)
  const [useMock, setUseMock]                   = useState(false)

  useEffect(() => {
    if (!id) return
    fetchProject(id)
    return () => clearActiveProject()
  }, [id])

  useEffect(() => {
    if (!activeProject || !id) return
    if (activeProject.client_id === user?.id) {
      fetchProjectProposals(id).catch(() => setUseMock(true))
    }
  }, [activeProject?.id])

  if (activeProjectLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 text-brand-400 animate-spin" /></div>
  }
  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="font-semibold">Project not found</p>
        <Link to="/projects" className="mt-3 text-sm text-brand-400 hover:underline">Back to Browse</Link>
      </div>
    )
  }

  const isOwner     = activeProject.client_id === user?.id
  const isFreelancer = user?.role === 'freelancer' || user?.role === 'both'
  const canBid      = isFreelancer && !isOwner && activeProject.status === 'open'
  const deadline    = activeProject.deadline ? new Date(activeProject.deadline) : null
  const daysLeft    = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86_400_000) : null
  const isUrgent    = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const displayedProposals = useMock
    ? MOCK_PROPOSALS.map((p) => ({ ...p, project_id: activeProject.id }))
    : projectProposals

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try { await deleteProject(id); navigate('/dashboard/projects') }
    catch { setDeleting(false); setDeleteConfirm(false) }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-5">
          <div className="glass rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border',
                  activeProject.project_type === 'fixed'
                    ? 'bg-brand-500/10 text-brand-300 border-brand-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20')}>
                  {activeProject.project_type === 'fixed' ? 'Fixed Price' : 'Hourly'}
                </span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border',
                  activeProject.status === 'open'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-surface-4 text-muted-foreground border-white/10')}>
                  {activeProject.status.replace('_', ' ')}
                </span>
                {isUrgent && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse-slow flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Urgent
                  </span>
                )}
              </div>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <Link to={`/projects/${activeProject.id}/edit`}
                    className="p-2 rounded-lg bg-surface-3 text-muted-foreground hover:text-foreground border border-white/[0.06] transition-colors">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button onClick={() => setDeleteConfirm(true)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold mb-2 leading-snug">{activeProject.title}</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-5">
              <span>Posted {timeAgo(activeProject.created_at)}</span>
              <span className="mx-1">·</span>
              <Eye className="h-3 w-3" /><span>{activeProject.views_count} views</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{activeProject.description}</p>
          </div>

          <div className="glass rounded-2xl border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-brand-400" />
              <h3 className="font-semibold text-sm">Required Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeProject.required_skills.map((skill) => (
                <span key={skill} className="px-3 py-1 rounded-lg text-sm bg-surface-3 text-foreground border border-white/[0.06] hover:border-brand-500/30 hover:text-brand-300 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {!isOwner && activeProject.client && (
            <div className="glass rounded-2xl border border-white/[0.06] p-5">
              <h3 className="font-semibold text-sm mb-3">About the Client</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-base font-bold text-brand-300">
                  {activeProject.client.full_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm">{activeProject.client.full_name}</p>
                    {activeProject.client.is_verified && <CheckCircle className="h-3.5 w-3.5 text-brand-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeProject.client.total_projects} projects posted · {activeProject.client.reputation_score.toFixed(1)} rating
                  </p>
                </div>
              </div>
            </div>
          )}

          {isOwner && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-400" />
                  <h3 className="font-semibold">Proposals <span className="text-sm font-normal text-muted-foreground">({displayedProposals.length})</span></h3>
                </div>
                {useMock && <span className="text-xs text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">Mock data</span>}
              </div>
              {projectProposalsLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 text-brand-400 animate-spin" /></div>
              ) : displayedProposals.length === 0 ? (
                <div className="glass rounded-2xl border border-white/[0.06] p-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No proposals yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedProposals.map((p) => <ProposalCard key={p.id} proposal={p as any} />)}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Right */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          {canBid && (
            <div className="glass rounded-2xl border border-brand-500/20 p-5">
              <p className="font-semibold mb-1">Interested?</p>
              <p className="text-xs text-muted-foreground mb-4">Submit a proposal to compete for this project</p>
              <button onClick={() => setProposalFormOpen(true)}
                className="w-full py-3 rounded-xl bg-gradient-brand text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">
                Submit a Proposal
              </button>
              <div className="flex items-center gap-2 mt-3 justify-center">
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-400 transition-colors">
                  <Bookmark className="h-3.5 w-3.5" /> Save
                </button>
                <span className="text-muted-foreground/30">·</span>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-400 transition-colors">
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
              </div>
            </div>
          )}

          <div className="glass rounded-2xl border border-white/[0.06] p-5 space-y-4">
            <h3 className="font-semibold text-sm">Project Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/10"><DollarSign className="h-3.5 w-3.5 text-brand-400" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(activeProject.budget_min)}
                    {activeProject.budget_max !== activeProject.budget_min && ` – ${formatCurrency(activeProject.budget_max)}`}
                  </p>
                </div>
              </div>
              {deadline && (
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', isUrgent ? 'bg-red-500/10' : 'bg-surface-3')}>
                    <Calendar className={cn('h-3.5 w-3.5', isUrgent ? 'text-red-400' : 'text-muted-foreground')} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className={cn('text-sm font-medium', isUrgent && 'text-red-400')}>
                      {formatDate(deadline)}
                      {daysLeft !== null && daysLeft > 0 && <span className="text-xs font-normal ml-1 text-muted-foreground">({daysLeft}d left)</span>}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-surface-3"><Users className="h-3.5 w-3.5 text-muted-foreground" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Proposals</p>
                  <p className="text-sm font-medium">{activeProject.proposal_count ?? 0} submitted</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-surface-3"><Clock className="h-3.5 w-3.5 text-muted-foreground" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Posted</p>
                  <p className="text-sm font-medium">{timeAgo(activeProject.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl border border-red-500/20 p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
              <h3 className="font-semibold">Delete Project?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">This will permanently delete this project and all proposals. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm bg-surface-3 border border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ProposalForm project={activeProject} open={proposalFormOpen}
        onClose={() => setProposalFormOpen(false)} onSuccess={() => fetchProject(id!)} />
    </div>
  )
}
