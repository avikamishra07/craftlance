import { motion } from 'framer-motion'
import { ExternalLink, Github, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioItem } from '@/types'

interface PortfolioCardProps {
  item: PortfolioItem
  editable?: boolean
  onEdit?: (item: PortfolioItem) => void
  onDelete?: (id: string) => void
  index?: number
}

export function PortfolioCard({ item, editable, onEdit, onDelete, index = 0 }: PortfolioCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl border border-white/[0.06] overflow-hidden group hover:border-brand-500/20 transition-all"
    >
      {/* Cover image / placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-surface-3 to-surface-2 overflow-hidden">
        {item.image_urls?.[0] ? (
          <img
            src={item.image_urls[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand opacity-20 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{item.title[0]}</span>
            </div>
          </div>
        )}
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-surface-0/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          {item.live_url && (
            <a href={item.live_url} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg bg-surface-2 border border-white/[0.1] text-foreground hover:border-brand-500/40 transition-all"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {item.github_url && (
            <a href={item.github_url} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg bg-surface-2 border border-white/[0.1] text-foreground hover:border-brand-500/40 transition-all"
            >
              <Github className="h-4 w-4" />
            </a>
          )}
        </div>
        {/* Category tag */}
        {item.category && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-0/80 backdrop-blur-sm border border-white/[0.1] text-muted-foreground">
              {item.category}
            </span>
          </div>
        )}
        {/* Edit/delete controls */}
        {editable && (
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={() => onEdit(item)}
                className="p-1.5 rounded-lg bg-surface-0/80 backdrop-blur-sm border border-white/[0.1] text-muted-foreground hover:text-foreground transition-all"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(item.id)}
                className="p-1.5 rounded-lg bg-surface-0/80 backdrop-blur-sm border border-white/[0.1] text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold leading-tight">{item.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>

        {/* Tech stack */}
        {item.tech_stack?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {item.tech_stack.slice(0, 4).map((tech) => (
              <span key={tech}
                className="text-[10px] px-2 py-0.5 rounded bg-surface-3 border border-white/[0.06] text-muted-foreground font-mono"
              >
                {tech}
              </span>
            ))}
            {item.tech_stack.length > 4 && (
              <span className="text-[10px] px-2 py-0.5 text-muted-foreground">
                +{item.tech_stack.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Outcomes */}
        {item.outcomes && (
          <div className="pt-1 border-t border-white/[0.06]">
            <p className="text-[11px] text-green-400 leading-relaxed">📈 {item.outcomes}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
