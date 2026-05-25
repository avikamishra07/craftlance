/**
 * SkillTestModal.tsx — M8
 * Timed 20-question MCQ quiz modal.
 * - Countdown timer (20 min); auto-submits on expiry
 * - Question + 4 options, keyboard nav (1–4)
 * - Progress bar
 * - Submit button active once all questions answered (or on timeout)
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionOut, TestStartResponse, TestSubmitResponse } from '@/api/skills'
import { skillsApi } from '@/api/skills'

interface SkillTestModalProps {
  testData:   TestStartResponse
  onComplete: (result: TestSubmitResponse) => void
  onClose:    () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function SkillTestModal({ testData, onComplete, onClose }: SkillTestModalProps) {
  const { test_id, skill_label, questions, duration_seconds } = testData

  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [answers,     setAnswers]      = useState<Record<number, number>>({})   // questionIndex → optionIndex
  const [timeLeft,    setTimeLeft]     = useState(duration_seconds)
  const [submitting,  setSubmitting]   = useState(false)
  const [error,       setError]        = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const answered    = Object.keys(answers).length
  const allAnswered = answered === questions.length
  const current     = questions[currentIdx] as QuestionOut

  // ── Timer ────────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (isTimeout = false) => {
    if (submitting) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSubmitting(true)
    setError(null)
    try {
      const stringAnswers = Object.fromEntries(
        Object.entries(answers).map(([k, v]) => [String(k), v])
      )
      const result = await skillsApi.submitTest(test_id, { answers: stringAnswers })
      onComplete(result)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || (isTimeout ? 'Test timed out.' : 'Submission failed. Please try again.'))
      setSubmitting(false)
    }
  }, [submitting, answers, test_id, onComplete])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [handleSubmit])

  // ── Keyboard shortcut (1–4 to pick option, ←→ to navigate) ─────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['1','2','3','4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1
        if (idx < current.options.length) {
          setAnswers(prev => ({ ...prev, [currentIdx]: idx }))
        }
      }
      if (e.key === 'ArrowRight' && currentIdx < questions.length - 1) setCurrentIdx(i => i + 1)
      if (e.key === 'ArrowLeft'  && currentIdx > 0)                    setCurrentIdx(i => i - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current.options.length, currentIdx, questions.length])

  const timerWarning = timeLeft < 120  // last 2 minutes

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        className="bg-surface-1 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="font-semibold text-lg">{skill_label} Skill Test</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Question {currentIdx + 1} of {questions.length} · {answered} answered
            </p>
          </div>
          <div className={cn(
            'flex items-center gap-2 font-mono text-sm font-semibold px-3 py-1.5 rounded-lg',
            timerWarning
              ? 'text-red-400 bg-red-400/10 animate-pulse'
              : 'text-brand-300 bg-brand-500/10',
          )}>
            <Timer size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <motion.div
            className="h-full bg-brand-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>

        {/* Question dots */}
        <div className="flex gap-1 px-6 pt-4 flex-wrap">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={cn(
                'w-6 h-6 rounded text-[10px] font-medium transition-colors',
                i === currentIdx
                  ? 'bg-brand-500 text-white'
                  : answers[i] !== undefined
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/8 text-muted-foreground hover:bg-white/12',
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0  }}
              exit={{ opacity: 0,    x: -20 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-base font-medium leading-relaxed mb-5">
                <span className="text-muted-foreground mr-2">{currentIdx + 1}.</span>
                {current.text}
              </p>

              <div className="space-y-2.5">
                {current.options.map((opt, oi) => {
                  const selected = answers[currentIdx] === oi
                  return (
                    <button
                      key={oi}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: oi }))}
                      className={cn(
                        'w-full text-left rounded-xl border px-4 py-3 text-sm transition-all',
                        'flex items-start gap-3',
                        selected
                          ? 'border-brand-500/60 bg-brand-500/10 text-foreground'
                          : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/6 text-foreground/80',
                      )}
                    >
                      <span className={cn(
                        'shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold mt-0.5',
                        selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-white/20 text-muted-foreground',
                      )}>
                        {oi + 1}
                      </span>
                      <span>{opt}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex items-center gap-3">
          <button
            onClick={() => setCurrentIdx(i => i - 1)}
            disabled={currentIdx === 0}
            className="p-2 rounded-lg border border-white/8 hover:bg-white/8 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => setCurrentIdx(i => i + 1)}
            disabled={currentIdx === questions.length - 1}
            className="p-2 rounded-lg border border-white/8 hover:bg-white/8 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>

          <div className="flex-1" />

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          {!allAnswered && (
            <span className="text-xs text-muted-foreground">
              {questions.length - answered} unanswered
            </span>
          )}

          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              allAnswered
                ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                : 'bg-white/8 text-muted-foreground hover:bg-white/12',
              submitting && 'opacity-60 cursor-not-allowed',
            )}
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {submitting ? 'Submitting…' : 'Submit Test'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
