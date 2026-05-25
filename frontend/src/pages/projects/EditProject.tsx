import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Tag, Calendar, Eye,
  ChevronRight, ChevronLeft, Loader2,
  AlertCircle, CheckCircle, DollarSign, Clock, Plus, X,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import type { ProjectType, UpdateProjectPayload } from '@/types'

interface FormData {
  title: string
  description: string
  project_type: ProjectType
  required_skills: string[]
  budget_min: string
  budget_max: string
  deadline: string
}

const SKILL_SUGGESTIONS = [
  'React','Node.js','Python','TypeScript','PostgreSQL',
  'AWS','Figma','Flutter','Next.js','FastAPI',
  'Docker','GraphQL','Solidity','Go','Machine Learning',
]

const STEPS = [
  { id: 1, label: 'Details',         icon: FileText },
  { id: 2, label: 'Skills & Budget', icon: Tag },
  { id: 3, label: 'Timeline',        icon: Calendar },
  { id: 4, label: 'Review',          icon: Eye },
]

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{msg}</p>
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

export default function EditProject() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeProject, activeProjectLoading, fetchProject, updateProject } = useProjectStore()

  const [step, setStep]         = useState(1)
  const [form, setForm]         = useState<FormData | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [errors, setErrors]     = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Hydrate form from fetched project
  useEffect(() => {
    if (id) fetchProject(id)
  }, [id])

  useEffect(() => {
    if (activeProject && !form) {
      setForm({
        title:           activeProject.title,
        description:     activeProject.description,
        project_type:    activeProject.project_type,
        required_skills: [...activeProject.required_skills],
        budget_min:      String(activeProject.budget_min),
        budget_max:      String(activeProject.budget_max),
        deadline:        activeProject.deadline ?? '',
      })
    }
  }, [activeProject])

  if (activeProjectLoading || !form) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 text-brand-400 animate-spin" />
      </div>
    )
  }

  const set = (key: keyof FormData, value: any) => {
    setForm((f) => f ? { ...f, [key]: value } : f)
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validateStep = (s: number): boolean => {
    const errs: typeof errors = {}
    if (s === 1) {
      if (form.title.trim().length < 10) errs.title = 'Title must be at least 10 characters'
      if (form.description.trim().length < 50) errs.description = 'Description must be at least 50 characters'
    }
    if (s === 2) {
      if (form.required_skills.length === 0) errs.required_skills = 'Add at least one required skill'
      const min = Number(form.budget_min), max = Number(form.budget_max)
      if (!form.budget_min || isNaN(min) || min < 10) errs.budget_min = 'Minimum budget must be at least $10'
      if (!form.budget_max || isNaN(max) || max < min) errs.budget_max = 'Maximum must be ≥ minimum budget'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => { if (validateStep(step)) setStep((s) => s + 1) }
  const back = () => setStep((s) => s - 1)

  const addSkill = (skill: string) => {
    const t = skill.trim()
    if (!t || form.required_skills.includes(t) || form.required_skills.length >= 15) return
    set('required_skills', [...form.required_skills, t])
    setSkillInput('')
  }
  const removeSkill = (skill: string) =>
    set('required_skills', form.required_skills.filter((s) => s !== skill))

  const handleSave = async () => {
    if (!id) return
    setIsSubmitting(true); setApiError(null)
    try {
      const payload: UpdateProjectPayload = {
        title:           form.title.trim(),
        description:     form.description.trim(),
        project_type:    form.project_type,
        required_skills: form.required_skills,
        budget_min:      Number(form.budget_min),
        budget_max:      Number(form.budget_max),
        deadline:        form.deadline || undefined,
      }
      await updateProject(id, payload)
      navigate(`/projects/${id}`)
    } catch (err: any) {
      setApiError(err.response?.data?.detail ?? 'Failed to save changes')
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-5">
          <div>
            <Label required>Project Title</Label>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
              className={cn('input-premium w-full', errors.title && 'border-red-500/50')} maxLength={500} />
            <div className="flex justify-between mt-1">
              <FieldError msg={errors.title} />
              <span className="text-xs text-muted-foreground ml-auto">{form.title.length}/500</span>
            </div>
          </div>
          <div>
            <Label required>Description</Label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              rows={8} className={cn('input-premium w-full resize-none leading-relaxed', errors.description && 'border-red-500/50')} />
            <div className="flex justify-between mt-1">
              <FieldError msg={errors.description} />
              <span className={cn('text-xs ml-auto', form.description.length < 50 ? 'text-muted-foreground' : 'text-green-400')}>{form.description.length} chars</span>
            </div>
          </div>
          <div>
            <Label>Project Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['fixed', 'hourly'] as ProjectType[]).map((type) => (
                <button key={type} onClick={() => set('project_type', type)}
                  className={cn('p-4 rounded-xl border text-left transition-all',
                    form.project_type === type
                      ? 'bg-brand-500/10 border-brand-500/30'
                      : 'bg-surface-3 border-white/[0.06] hover:border-white/20')}>
                  <div className="flex items-center gap-2 mb-1">
                    {type === 'fixed' ? <DollarSign className="h-4 w-4 text-brand-400" /> : <Clock className="h-4 w-4 text-amber-400" />}
                    <span className="text-sm font-medium">{type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {type === 'fixed' ? 'Pay a set amount for the project' : 'Pay per hour worked'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )

      case 2: return (
        <div className="space-y-5">
          <div>
            <Label required>Required Skills</Label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                placeholder="Type a skill and press Enter…"
                className={cn('input-premium flex-1 text-sm', errors.required_skills && 'border-red-500/50')} />
              <button onClick={() => addSkill(skillInput)}
                className="px-3 py-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <FieldError msg={errors.required_skills} />
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SKILL_SUGGESTIONS.filter((s) => !form.required_skills.includes(s)).slice(0, 10).map((s) => (
                <button key={s} onClick={() => addSkill(s)}
                  className="px-2 py-0.5 rounded-md text-xs bg-surface-3 text-muted-foreground border border-white/[0.05] hover:border-brand-500/30 hover:text-brand-300 transition-colors">
                  + {s}
                </button>
              ))}
            </div>
            {form.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 bg-surface-3 rounded-xl border border-white/[0.05]">
                {form.required_skills.map((s) => (
                  <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-brand-500/10 text-brand-300 border border-brand-500/20">
                    {s}<button onClick={() => removeSkill(s)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Min Budget (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input type="number" min={10} value={form.budget_min} onChange={(e) => set('budget_min', e.target.value)}
                  className={cn('input-premium w-full pl-7', errors.budget_min && 'border-red-500/50')} />
              </div>
              <FieldError msg={errors.budget_min} />
            </div>
            <div>
              <Label required>Max Budget (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input type="number" min={10} value={form.budget_max} onChange={(e) => set('budget_max', e.target.value)}
                  className={cn('input-premium w-full pl-7', errors.budget_max && 'border-red-500/50')} />
              </div>
              <FieldError msg={errors.budget_max} />
            </div>
          </div>
          {form.budget_min && form.budget_max && Number(form.budget_max) >= Number(form.budget_min) && (
            <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/15 text-sm text-brand-300">
              {formatCurrency(Number(form.budget_min))} – {formatCurrency(Number(form.budget_max))}
            </div>
          )}
        </div>
      )

      case 3: return (
        <div className="space-y-5">
          <div>
            <Label>Project Deadline</Label>
            <input type="date" value={form.deadline} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => set('deadline', e.target.value)} className="input-premium w-full" />
            <p className="text-xs text-muted-foreground mt-1">Leave blank if flexible</p>
          </div>
        </div>
      )

      case 4: return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Review your changes before saving.</p>
          <div className="glass rounded-2xl border border-white/[0.06] p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Title</p>
              <p className="font-semibold">{form.title}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-muted-foreground line-clamp-4">{form.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Budget</p>
                <p className="font-medium">{formatCurrency(Number(form.budget_min))} – {formatCurrency(Number(form.budget_max))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                <p className="font-medium">{form.project_type === 'fixed' ? 'Fixed Price' : 'Hourly'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {form.required_skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-surface-3 text-muted-foreground border border-white/[0.05]">{s}</span>
                ))}
              </div>
            </div>
          </div>
          {apiError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {apiError}
            </div>
          )}
          <button disabled={isSubmitting} onClick={handleSave}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-gradient-brand text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      )

      default: return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Update your project details</p>
      </motion.div>

      {/* Steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = step > s.id; const active = step === s.id
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button onClick={() => done && setStep(s.id)}
                className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                  active && 'text-brand-300 font-medium',
                  done && 'text-muted-foreground hover:text-foreground cursor-pointer',
                  !active && !done && 'text-muted-foreground/40 cursor-default')}>
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  active && 'bg-brand-500 text-white',
                  done && 'bg-green-500/20 text-green-400',
                  !active && !done && 'bg-surface-3 text-muted-foreground/40')}>
                  {done ? <CheckCircle className="h-3.5 w-3.5" /> : s.id}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={cn('flex-1 h-px mx-1', done ? 'bg-green-500/30' : 'bg-surface-4')} />}
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
          className="glass rounded-2xl border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-6">
            {(() => { const S = STEPS[step - 1]; return <S.icon className="h-5 w-5 text-brand-400" /> })()}
            <h2 className="font-semibold">{STEPS[step - 1].label}</h2>
          </div>
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {step < 4 && (
        <div className="flex items-center justify-between">
          {step > 1
            ? <button onClick={back} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-surface-2 border border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            : <div />}
          <button onClick={next} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-brand text-white hover:opacity-90 transition-opacity">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
