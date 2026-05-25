import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Clock, DollarSign, Users, Eye, Zap, Calendar,
  ArrowUpRight, Bookmark, CheckCircle,
} from 'lucide-react'
import { cn, formatCurrency, timeAgo } from '@/lib/utils'
import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
  index?: number
  variant?: 'browse' | 'manage'
  onDelete?: (id: string) => void
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  open:        { label: 'Open',        className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  completed:   { label: 'Completed',   className: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  draft:       { label: 'Draft',       className: 'bg-surface-4 text-muted-foreground border-white/10' },
}

export function ProjectCard({ project, index = 0, variant = 'browse', onDelete }: ProjectCardProps) {
  const status = STATUS_STYLES[project.status] ?? STATUS_STYLES.open
  const isFixed = project.project_type === 'fixed'

  const deadline = project.deadline
    ? new Date(project.deadline)
    : null
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / 86_400_000)
    : null
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const isExpired = daysLeft !== null && daysLeft <= 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'group relative glass rounded-2xl border border-white/[0.06] p-5',
        'hover:border-brand-500/30 hover:shadow-glow-sm transition-all duration-300',
      )}
    >
      {/* Type pill + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
            isFixed
              ? 'bg-brand-500/10 text-brand-300 border-brand-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          )}>
            {isFixed ? <DollarSign className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {isFixed ? 'Fixed Price' : 'Hourly'}
          </span>

          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
            status.className,
          )}>
            {status.label}
          </span>

          {isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse-slow">
              <Zap className="h-3 w-3" /> Urgent
            </span>
          )}
        </div>

        {/* Client info — browse view only */}
        {variant === 'browse' && project.client && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-[10px] font-bold text-brand-300">
              {project.client.full_name[0]}
            </div>
            <span className="hidden sm:block">{project.client.full_name}</span>
            {project.client.is_verified && (
              <CheckCircle className="h-3 w-3 text-brand-400" />
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <Link to={`/projects/${project.id}`}>
        <h3 className={cn(
          'font-semibold text-base leading-snug mb-2',
          'group-hover:text-brand-300 transition-colors duration-200 line-clamp-2',
        )}>
          {project.title}
        </h3>
      </Link>

      {/* Description excerpt */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
        {project.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.required_skills.slice(0, 5).map((skill) => (
          <span
            key={skill}
            className="px-2 py-0.5 rounded-md text-xs bg-surface-3 text-muted-foreground border border-white/[0.05] hover:border-brand-500/30 hover:text-brand-300 transition-colors"
          >
            {skill}
          </span>
        ))}
        {project.required_skills.length > 5 && (
          <span className="px-2 py-0.5 rounded-md text-xs text-muted-foreground">
            +{project.required_skills.length - 5} more
          </span>
        )}
      </div>

      {/* Footer meta row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {/* Budget */}
          <span className="font-semibold text-sm text-foreground">
            {formatCurrency(project.budget_min)}
            {project.budget_max !== project.budget_min && (
              <> – {formatCurrency(project.budget_max)}</>
            )}
          </span>

          {/* Proposals count */}
          {project.proposal_count !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.proposal_count} bid{project.proposal_count !== 1 ? 's' : ''}
            </span>
          )}

          {/* Views */}
          <span className="hidden sm:flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {project.views_count}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {/* Deadline */}
          {deadline && (
            <span className={cn(
              'flex items-center gap-1',
              isUrgent && 'text-red-400',
              isExpired && 'text-muted-foreground line-through',
            )}>
              <Calendar className="h-3 w-3" />
              {isExpired
                ? 'Expired'
                : `${daysLeft}d left`}
            </span>
          )}

          {/* Posted time */}
          <span>{timeAgo(project.created_at)}</span>

          {/* Action arrow */}
          <Link
            to={`/projects/${project.id}`}
            className="p-1 rounded-lg hover:bg-brand-500/10 hover:text-brand-400 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Manage-mode: delete button */}
      {variant === 'manage' && onDelete && (
        <button
          onClick={() => onDelete(project.id)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
        >
          <span className="sr-only">Delete project</span>
          ✕
        </button>
      )}
    </motion.article>
  )
}
