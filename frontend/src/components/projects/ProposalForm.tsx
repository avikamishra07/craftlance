import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Clock, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project, SubmitProposalPayload } from '@/types'
import { useProjectStore } from '@/store/projectStore'

interface ProposalFormProps {
  project: Project
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const MIN_LETTER = 100
const MAX_LETTER = 5000

interface FormState {
  bid_amount: string
  timeline_days: string
  cover_letter: string
}

interface FormErrors {
  bid_amount?: string
  timeline_days?: string
  cover_letter?: string
}

function validate(form: FormState, project: Project): FormErrors {
  const errors: FormErrors = {}
  const bid = Number(form.bid_amount)
  const days = Number(form.timeline_days)

  if (!form.bid_amount || isNaN(bid) || bid < 5) {
    errors.bid_amount = 'Bid must be at least $5'
  } else if (bid > 1_000_000) {
    errors.bid_amount = 'Bid cannot exceed $1,000,000'
  } else if (bid < project.budget_min * 0.5) {
    errors.bid_amount = `Bid seems very low for this project (budget: $${project.budget_min}–$${project.budget_max})`
  }

  if (!form.timeline_days || isNaN(days) || days < 1) {
    errors.timeline_days = 'Timeline must be at least 1 day'
  } else if (days > 365) {
    errors.timeline_days = 'Timeline cannot exceed 365 days'
  }

  if (form.cover_letter.trim().length < MIN_LETTER) {
    errors.cover_letter = `Cover letter must be at least ${MIN_LETTER} characters`
  } else if (form.cover_letter.length > MAX_LETTER) {
    errors.cover_letter = `Cover letter must be under ${MAX_LETTER} characters`
  }

  return errors
}

export function ProposalForm({ project, open, onClose, onSuccess }: ProposalFormProps) {
  const { submitProposal } = useProjectStore()
  const [form, setForm] = useState<FormState>({
    bid_amount: String(project.budget_min),
    timeline_days: '14',
    cover_letter: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
    }
  }, [form.cover_letter])

  // Reset on re-open
  useEffect(() => {
    if (open) {
      setForm({ bid_amount: String(project.budget_min), timeline_days: '14', cover_letter: '' })
      setErrors({})
      setTouched(new Set())
      setSubmitted(false)
      setApiError(null)
    }
  }, [open, project.budget_min])

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setTouched((t) => new Set(t).add(key))
  }

  const getFieldError = (key: keyof FormState) =>
    touched.has(key) ? errors[key] : undefined

  const letterLen = form.cover_letter.length
  const letterPct = Math.min(letterLen / MAX_LETTER, 1)
  const letterColor =
    letterLen < MIN_LETTER
      ? 'text-muted-foreground'
      : letterLen > MAX_LETTER * 0.9
      ? 'text-red-400'
      : 'text-green-400'

  const handleSubmit = async () => {
    // Validate all fields
    const allTouched = new Set<string>(['bid_amount', 'timeline_days', 'cover_letter'])
    setTouched(allTouched)
    const errs = validate(form, project)
    setErrors(errs)
    if (Object.keys(errs).length) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      const payload: SubmitProposalPayload = {
        bid_amount: Number(form.bid_amount),
        timeline_days: Number(form.timeline_days),
        cover_letter: form.cover_letter.trim(),
      }
      await submitProposal(project.id, payload)
      setSubmitted(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1800)
    } catch (err: any) {
      setApiError(err.response?.data?.detail ?? 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Live validate on change when field has been touched
  useEffect(() => {
    if (touched.size > 0) {
      setErrors(validate(form, project))
    }
  }, [form])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-surface-1 border-l border-white/[0.06] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-white/[0.06]">
              <div>
                <h2 className="font-semibold text-base">Submit Proposal</h2>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.title}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Success state */}
            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Proposal Submitted!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The client will review your proposal shortly.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form body */}
            {!submitted && (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Project budget context */}
                <div className="bg-surface-3 rounded-xl p-3 border border-white/[0.05] text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Client's budget range</p>
                  <p className="font-semibold text-brand-300">
                    ${project.budget_min.toLocaleString()} – ${project.budget_max.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({project.project_type === 'fixed' ? 'fixed price' : 'hourly'})
                    </span>
                  </p>
                </div>

                {/* Bid amount */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">
                    Your Bid <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      min={5}
                      value={form.bid_amount}
                      onChange={(e) => set('bid_amount', e.target.value)}
                      onBlur={() => setTouched((t) => new Set(t).add('bid_amount'))}
                      placeholder={String(project.budget_min)}
                      className={cn(
                        'input-premium w-full pl-9',
                        getFieldError('bid_amount') && 'border-red-500/50 focus:ring-red-500/30',
                      )}
                    />
                  </div>
                  {getFieldError('bid_amount') && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {getFieldError('bid_amount')}
                    </p>
                  )}
                </div>

                {/* Timeline */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">
                    Delivery Timeline <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={form.timeline_days}
                      onChange={(e) => set('timeline_days', e.target.value)}
                      onBlur={() => setTouched((t) => new Set(t).add('timeline_days'))}
                      className={cn(
                        'input-premium w-full pl-9',
                        getFieldError('timeline_days') && 'border-red-500/50 focus:ring-red-500/30',
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      days
                    </span>
                  </div>
                  {getFieldError('timeline_days') && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {getFieldError('timeline_days')}
                    </p>
                  )}
                </div>

                {/* Cover letter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium">
                      Cover Letter <span className="text-red-400">*</span>
                    </label>
                    <span className={cn('text-xs tabular-nums', letterColor)}>
                      {letterLen} / {MAX_LETTER}
                    </span>
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      ref={textareaRef}
                      value={form.cover_letter}
                      onChange={(e) => set('cover_letter', e.target.value)}
                      onBlur={() => setTouched((t) => new Set(t).add('cover_letter'))}
                      rows={6}
                      placeholder={`Introduce yourself and explain why you're the best fit for this project. Mention relevant experience, your approach, and what makes you stand out.\n\nMinimum ${MIN_LETTER} characters.`}
                      className={cn(
                        'input-premium w-full pl-9 resize-none leading-relaxed',
                        getFieldError('cover_letter') && 'border-red-500/50 focus:ring-red-500/30',
                      )}
                    />
                  </div>

                  {/* Progress bar */}
                  <div className="h-0.5 bg-surface-3 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        letterLen < MIN_LETTER ? 'bg-muted-foreground' :
                        letterLen > MAX_LETTER * 0.9 ? 'bg-red-500' : 'bg-green-500',
                      )}
                      animate={{ width: `${letterPct * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>

                  {getFieldError('cover_letter') && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {getFieldError('cover_letter')}
                    </p>
                  )}
                </div>

                {/* Tips */}
                <div className="bg-brand-500/5 border border-brand-500/15 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-medium text-brand-300">Tips for a strong proposal</p>
                  {[
                    'Address the client\'s specific needs from the project description',
                    'Highlight directly relevant past work or skills',
                    'Be specific about your approach and timeline',
                    'Keep it concise — clients read dozens of proposals',
                  ].map((tip) => (
                    <p key={tip} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-brand-400 mt-0.5 shrink-0">·</span> {tip}
                    </p>
                  ))}
                </div>

                {/* API error */}
                {apiError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {apiError}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {!submitted && (
              <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface-3 text-muted-foreground hover:text-foreground hover:bg-surface-4 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-brand text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  ) : (
                    'Submit Proposal'
                  )}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
