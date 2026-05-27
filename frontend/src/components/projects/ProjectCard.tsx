import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Clock, DollarSign, Users, Eye, Zap, Calendar,
  ArrowUpRight, CheckCircle,
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
  open:        { label: 'Open',        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/10  text-blue-400   border-blue-500/20' },
  completed:   { label: 'Completed',   className: 'bg-amber-500/10  text-amber-400  border-amber-500/20' },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-500/10    text-red-400    border-red-500/20' },
  draft:       { label: 'Draft',       className: 'bg-surface-4     text-muted-foreground border-white/10' },
}

export function ProjectCard({ project, index = 0, variant = 'browse', onDelete }: ProjectCardProps) {
  const status  = STATUS_STYLES[project.status] ?? STATUS_STYLES.open
  const isFixed = project.project_type === 'fixed'

  const deadline = project.deadline ? new Date(project.deadline) : null
  const daysLeft  = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86_400_000) : null
  const isUrgent  = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const isExpired = daysLeft !== null && daysLeft <= 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={cn(
        'group relative bg-surface-1 rounded-lg border border-white/[0.07] p-5',
        'hover:border-amber-500/25 hover:bg-surface-2/70 transition-all duration-200',
      )}
    >
      {/* Top row: type + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'badge',
            isFixed
              ? 'bg-amber-500/10  text-amber-400  border-amber-500/20'
              : 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          )}>
            {isFixed ? <DollarSign className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {isFixed ? 'Fixed' : 'Hourly'}
          </span>

          <span className={cn('badge', status.className)}>
            {status.label}
          </span>

          {isUrgent && (
            <span className="badge bg-red-500/10 text-red-400 border-red-500/20 animate-pulse-slow">
              <Zap className="h-3 w-3" /> Urgent
            </span>
          )}
        </div>

        {variant === 'browse' && project.client && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400">
              {project.client.full_name[0]}
            </div>
            <span className="hidden sm:block">{project.client.full_name}</span>
            {project.client.is_verified && <CheckCircle className="h-3 w-3 text-amber-400" />}
          </div>
        )}
      </div>

      {/* Title */}
      <Link to={`/projects/${project.id}`}>
        <h3 className={cn(
          'font-display font-semibold text-base leading-snug mb-2 line-clamp-2',
          'group-hover:text-amber-300 transition-colors duration-150',
        )}>
          {project.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
        {project.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.required_skills.slice(0, 5).map((skill) => (
          <span
            key={skill}
            className="px-2 py-0.5 rounded text-xs bg-surface-3 text-muted-foreground border border-white/[0.05] hover:border-amber-500/25 hover:text-amber-300 transition-colors cursor-default"
          >
            {skill}
          </span>
        ))}
        {project.required_skills.length > 5 && (
          <span className="px-2 py-0.5 rounded text-xs text-muted-foreground">
            +{project.required_skills.length - 5}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-semibold text-sm text-foreground">
            {formatCurrency(project.budget_min)}
            {project.budget_max !== project.budget_min && (
              <> – {formatCurrency(project.budget_max)}</>
            )}
          </span>
          {project.proposal_count !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.proposal_count} bid{project.proposal_count !== 1 ? 's' : ''}
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1">
            <Eye className="h-3 w-3" /> {project.views_count}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {deadline && (
            <span className={cn(
              'flex items-center gap-1',
              isUrgent && 'text-red-400',
              isExpired && 'line-through',
            )}>
              <Calendar className="h-3 w-3" />
              {isExpired ? 'Expired' : `${daysLeft}d left`}
            </span>
          )}
          <span>{timeAgo(project.created_at)}</span>
          <Link
            to={`/projects/${project.id}`}
            className="p-1 rounded hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {variant === 'manage' && onDelete && (
        <button
          onClick={() => onDelete(project.id)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs"
        >
          ✕
        </button>
      )}
    </motion.article>
  )
}