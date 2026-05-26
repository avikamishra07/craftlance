/**
 * CommunityFilterSidebar.tsx — M9
 * Filter sidebar for /community page.
 * Filters: skills, hourly rate range, availability, reputation minimum, verified-only toggle.
 */
import { useState, useCallback } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FreelancerFilters, AvailabilityStatus } from '@/api/community'

const SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'Python', 'Node.js', 'SQL',
  'Docker', 'GraphQL', 'Vue', 'Go', 'Rust', 'AWS', 'Design',
]

// FIX: values now match the backend AvailabilityStatus enum exactly
//      (was: 'full_time' | 'part_time' | 'contract')
const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: 'available',     label: 'Available'     },
  { value: 'busy',          label: 'Busy'          },
  { value: 'not_available', label: 'Not Available' },
]

interface Props {
  value:    FreelancerFilters
  onChange: (filters: FreelancerFilters) => void
  onReset:  () => void
}

export function CommunityFilterSidebar({ value, onChange, onReset }: Props) {
  const [skillInput, setSkillInput] = useState('')

  const currentSkills: string[] = value.skills
    ? value.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (!trimmed || currentSkills.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) return
    const updated = [...currentSkills, trimmed]
    onChange({ ...value, skills: updated.join(',') })
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    const updated = currentSkills.filter(s => s !== skill)
    onChange({ ...value, skills: updated.length ? updated.join(',') : undefined })
  }

  const set = useCallback((patch: Partial<FreelancerFilters>) => {
    onChange({ ...value, ...patch })
  }, [value, onChange])

  const hasFilters = !!(
    currentSkills.length ||
    value.min_rate != null ||
    value.max_rate != null ||
    value.availability ||
    value.min_reputation != null ||
    value.verified_only
  )

  return (
    <aside className="w-64 shrink-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={14} />
          Filters
        </div>
        {hasFilters && (
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Skills */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Skills</p>
        <div className="flex gap-1.5 mb-2">
          <input
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
            placeholder="Add skill…"
            className="flex-1 h-8 rounded-lg bg-white/6 border border-white/10 px-2.5 text-xs focus:outline-none focus:border-brand-500/50"
          />
          <button
            onClick={() => addSkill(skillInput)}
            className="h-8 px-2 rounded-lg bg-brand-500/20 text-brand-300 text-xs hover:bg-brand-500/30 transition-colors"
          >
            +
          </button>
        </div>

        {currentSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {currentSkills.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1 text-[11px] bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-full px-2 py-0.5"
              >
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-brand-100">
                  <X size={9} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {SKILL_SUGGESTIONS
            .filter(s => !currentSkills.map(c => c.toLowerCase()).includes(s.toLowerCase()))
            .slice(0, 8)
            .map(s => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                className="text-[11px] bg-white/5 border border-white/8 rounded-full px-2 py-0.5 text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors"
              >
                {s}
              </button>
            ))}
        </div>
      </section>

      {/* Hourly rate */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Hourly Rate (USD)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={value.min_rate ?? ''}
            onChange={e => set({ min_rate: e.target.value ? +e.target.value : undefined })}
            className="w-full h-8 rounded-lg bg-white/6 border border-white/10 px-2.5 text-xs focus:outline-none focus:border-brand-500/50"
          />
          <span className="text-muted-foreground text-xs shrink-0">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={value.max_rate ?? ''}
            onChange={e => set({ max_rate: e.target.value ? +e.target.value : undefined })}
            className="w-full h-8 rounded-lg bg-white/6 border border-white/10 px-2.5 text-xs focus:outline-none focus:border-brand-500/50"
          />
        </div>
      </section>

      {/* Availability */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Availability</p>
        <div className="space-y-1.5">
          {AVAILABILITY_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="availability"
                value={opt.value}
                checked={value.availability === opt.value}
                onChange={() => set({
                  availability: value.availability === opt.value ? undefined : opt.value,
                })}
                className="accent-brand-500"
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Reputation minimum */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Min Reputation
          {value.min_reputation != null && (
            <span className="ml-1.5 text-brand-400">≥ {value.min_reputation.toFixed(1)}</span>
          )}
        </p>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={value.min_reputation ?? 0}
          onChange={e => set({ min_reputation: +e.target.value || undefined })}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>Any</span>
          <span>5.0 ★</span>
        </div>
      </section>

      {/* Verified only */}
      <section>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-medium">Verified only</span>
          <button
            role="switch"
            aria-checked={!!value.verified_only}
            onClick={() => set({ verified_only: !value.verified_only })}
            className={cn(
              'w-9 h-5 rounded-full transition-colors relative',
              value.verified_only ? 'bg-brand-500' : 'bg-white/15',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                value.verified_only ? 'translate-x-4.5' : 'translate-x-0.5',
              )}
            />
          </button>
        </label>
        <p className="text-[11px] text-muted-foreground mt-1">
          Only show ID-verified freelancers
        </p>
      </section>
    </aside>
  )
}