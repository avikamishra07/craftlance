import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, Loader2 } from 'lucide-react'
import type { PortfolioItem } from '@/types'

const schema = z.object({
  title: z.string().min(3, 'Required').max(200),
  description: z.string().min(10, 'Describe the project').max(2000),
  live_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  github_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  category: z.string().optional(),
  outcomes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface PortfolioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: FormData & { tech_stack: string[] }) => Promise<void>
  editing?: PortfolioItem | null
}

const CATEGORIES = ['Web App', 'Mobile', 'API / Backend', 'UI/UX', 'Data / ML', 'DevOps', 'Other']

export function PortfolioModal({ isOpen, onClose, onSave, editing }: PortfolioModalProps) {
  const [techInput, setTechInput] = useState('')
  const [techStack, setTechStack] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (editing) {
      reset({
        title: editing.title,
        description: editing.description,
        live_url: editing.live_url ?? '',
        github_url: editing.github_url ?? '',
        category: editing.category ?? '',
        outcomes: editing.outcomes ?? '',
      })
      setTechStack(editing.tech_stack ?? [])
    } else {
      reset({ title: '', description: '', live_url: '', github_url: '', category: '', outcomes: '' })
      setTechStack([])
    }
  }, [editing, isOpen])

  const addTech = (t: string) => {
    const s = t.trim()
    if (s && !techStack.includes(s) && techStack.length < 10) {
      setTechStack([...techStack, s])
      setTechInput('')
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSaving(true)
    try {
      await onSave({
        ...data,
        tech_stack: techStack,
        live_url: data.live_url || undefined,
        github_url: data.github_url || undefined,
        category: data.category || undefined,
        outcomes: data.outcomes || undefined,
      } as any)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative glass rounded-2xl border border-white/[0.1] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-glass"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold">{editing ? 'Edit project' : 'Add portfolio project'}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project title</label>
                <input {...register('title')} placeholder="e.g. E-commerce Dashboard with Analytics" className="input-premium w-full" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                <textarea {...register('description')} rows={3} placeholder="What did you build? What problem did it solve?" className="input-premium w-full resize-none" />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => setValue('category', c)}
                      className="px-3 py-1 text-xs rounded-full border border-white/[0.08] bg-surface-2 text-muted-foreground hover:border-brand-500/40 hover:text-brand-300 transition-all"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tech stack */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tech stack</label>
                <div className="flex gap-2">
                  <input value={techInput} onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(techInput) } }}
                    placeholder="React, Node.js... (Enter to add)"
                    className="input-premium flex-1 text-xs"
                  />
                  <button type="button" onClick={() => addTech(techInput)}
                    className="px-3 py-2 rounded-lg border border-white/[0.08] bg-surface-2 text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {techStack.map((t) => (
                      <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] rounded-full">
                        {t}
                        <button type="button" onClick={() => setTechStack(techStack.filter((x) => x !== t))}>
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live URL</label>
                  <input {...register('live_url')} placeholder="https://..." className="input-premium w-full" />
                  {errors.live_url && <p className="text-xs text-destructive">{errors.live_url.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">GitHub URL</label>
                  <input {...register('github_url')} placeholder="https://github.com/..." className="input-premium w-full" />
                  {errors.github_url && <p className="text-xs text-destructive">{errors.github_url.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Measurable outcomes</label>
                <input {...register('outcomes')} placeholder="e.g. Reduced load time by 40%, 10k+ users" className="input-premium w-full" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2 text-sm border border-white/[0.08] rounded-lg text-muted-foreground hover:text-foreground hover:border-white/[0.16] transition-all"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 py-2 text-sm bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editing ? 'Save changes' : 'Add project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
