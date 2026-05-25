import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Briefcase, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import { ProjectCard } from '@/components/projects/ProjectCard'
import type { ProjectType } from '@/types'

const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL',
  'AWS', 'Figma', 'Flutter', 'Solidity', 'Machine Learning',
  'FastAPI', 'Next.js', 'Go', 'Rust', 'Docker',
]

const BUDGET_PRESETS = [
  { label: 'Any',        min: undefined, max: undefined },
  { label: '< $500',     min: undefined, max: 500 },
  { label: '$500–$2k',   min: 500,       max: 2000 },
  { label: '$2k–$10k',   min: 2000,      max: 10000 },
  { label: '$10k+',      min: 10000,     max: undefined },
]

export default function BrowseProjects() {
  const { browse, fetchProjects, setFilters, nextPage, prevPage } = useProjectStore()
  const { projects, total, page, hasNext, hasPrev, isLoading } = browse

  const [search, setSearch]           = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [projectType, setProjectType] = useState<ProjectType | ''>('')
  const [budgetPreset, setBudgetPreset] = useState(0)
  const [skillInput, setSkillInput]   = useState('')

  useEffect(() => { fetchProjects() }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => applyFilters(), 400)
    return () => clearTimeout(t)
  }, [search])

  const applyFilters = useCallback(() => {
    const preset = BUDGET_PRESETS[budgetPreset]
    fetchProjects({
      q: search || undefined,
      skills: selectedSkills.length ? selectedSkills.join(',') : undefined,
      project_type: (projectType as ProjectType) || undefined,
      budget_min: preset.min,
      budget_max: preset.max,
      page: 1,
    })
  }, [search, selectedSkills, projectType, budgetPreset])

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (!trimmed || selectedSkills.includes(trimmed)) return
    setSelectedSkills((s) => [...s, trimmed])
    setSkillInput('')
  }

  const removeSkill = (skill: string) =>
    setSelectedSkills((s) => s.filter((x) => x !== skill))

  const clearAll = () => {
    setSearch(''); setSelectedSkills([]); setProjectType(''); setBudgetPreset(0)
    fetchProjects({ q: undefined, skills: undefined, project_type: undefined, budget_min: undefined, budget_max: undefined, page: 1 })
  }

  const hasActiveFilters = !!(search || selectedSkills.length || projectType || budgetPreset !== 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-2xl font-bold">Browse Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total.toLocaleString()} open project${total !== 1 ? 's' : ''}` : 'Find your next project'}
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
            showFilters || hasActiveFilters
              ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
              : 'bg-surface-2 border-white/[0.06] text-muted-foreground hover:text-foreground',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
              {[search, selectedSkills.length, projectType, budgetPreset !== 0].filter(Boolean).length}
            </span>
          )}
        </button>
      </motion.div>

      {/* Search bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects by title, description, or keyword…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-premium w-full pl-11 pr-10 py-3 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </motion.div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="glass rounded-2xl border border-white/[0.06] p-5 space-y-5"
        >
          {/* Project type */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Project Type</p>
            <div className="flex gap-2">
              {(['', 'fixed', 'hourly'] as const).map((type) => (
                <button key={type} onClick={() => setProjectType(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    projectType === type
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
                      : 'bg-surface-3 border-white/[0.06] text-muted-foreground hover:text-foreground',
                  )}
                >
                  {type === '' ? 'Any' : type === 'fixed' ? 'Fixed Price' : 'Hourly'}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Budget</p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_PRESETS.map((preset, i) => (
                <button key={preset.label} onClick={() => setBudgetPreset(i)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    budgetPreset === i
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
                      : 'bg-surface-3 border-white/[0.06] text-muted-foreground hover:text-foreground',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Required Skills</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text" placeholder="Type a skill and press Enter…" value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                className="input-premium flex-1 text-sm py-2"
              />
              <button onClick={() => addSkill(skillInput)}
                className="px-3 py-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 text-sm hover:bg-brand-500/20 transition-colors">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SKILL_SUGGESTIONS.filter((s) => !selectedSkills.includes(s)).slice(0, 8).map((s) => (
                <button key={s} onClick={() => addSkill(s)}
                  className="px-2 py-0.5 rounded-md text-xs bg-surface-3 text-muted-foreground border border-white/[0.05] hover:border-brand-500/30 hover:text-brand-300 transition-colors">
                  + {s}
                </button>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedSkills.map((s) => (
                  <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-brand-500/10 text-brand-300 border border-brand-500/20">
                    {s}<button onClick={() => removeSkill(s)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
            {hasActiveFilters && (
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-red-400 transition-colors">Clear all filters</button>
            )}
            <button onClick={applyFilters}
              className="ml-auto px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Apply Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 text-brand-400 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center mb-4">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">No projects found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Check back soon for new listings'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearAll} className="mt-4 text-sm text-brand-400 hover:underline">Clear filters</button>
          )}
        </motion.div>
      ) : (
        <>
          <div className="grid gap-4">
            {projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
          {(hasNext || hasPrev) && (
            <div className="flex items-center justify-between pt-2">
              <button onClick={prevPage} disabled={!hasPrev}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-surface-2 border border-white/[0.06] disabled:opacity-30 hover:bg-surface-3 transition-colors">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-xs text-muted-foreground">Page {page}</span>
              <button onClick={nextPage} disabled={!hasNext}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-surface-2 border border-white/[0.06] disabled:opacity-30 hover:bg-surface-3 transition-colors">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
