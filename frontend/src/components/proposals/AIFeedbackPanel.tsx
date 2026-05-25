import { useState } from 'react'
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { ScoreRing } from './ScoreRing'
import { cn } from '@/lib/utils'
import type { Proposal } from '@/types'

interface AIFeedbackPanelProps {
  proposal: Proposal
  onRescore?: () => void
  rescoring?: boolean
}

interface CategoryScore {
  key: keyof Proposal
  label: string
  hint: string
}

const CATEGORIES: CategoryScore[] = [
  { key: 'ai_clarity_score',        label: 'Clarity',        hint: 'How clearly you communicated your approach' },
  { key: 'ai_relevance_score',      label: 'Relevance',      hint: 'How well you addressed the project requirements' },
  { key: 'ai_professionalism_score',label: 'Professionalism',hint: 'Tone, structure, and presentation' },
  { key: 'ai_value_score',          label: 'Value',          hint: 'Whether your bid & timeline seem reasonable' },
]

function ScorePending() {
  return (
    <div className="rounded-xl border border-white/8 bg-surface-1 p-5 space-y-4">
      <div className="flex items-center gap-2 text-brand-400">
        <Sparkles size={16} className="animate-pulse" />
        <span className="text-sm font-medium">AI Score pending…</span>
      </div>
      <div className="flex gap-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-[72px] h-[72px] rounded-full bg-white/5 animate-pulse" />
            <div className="h-3 w-12 rounded bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}

export function AIFeedbackPanel({ proposal, onRescore, rescoring }: AIFeedbackPanelProps) {
  const [expanded, setExpanded] = useState(true)

  // Pending state — scores not yet computed
  if (proposal.ai_score == null) {
    return <ScorePending />
  }

  return (
    <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-500/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-brand-300">
          <Sparkles size={15} />
          <span className="text-sm font-semibold">AI Score</span>
          <span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-medium">
            {proposal.ai_score}/100
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onRescore && (
            <button
              onClick={(e) => { e.stopPropagation(); onRescore() }}
              disabled={rescoring}
              className="p-1 rounded hover:bg-white/8 transition-colors text-muted-foreground hover:text-foreground"
              title="Re-score proposal"
            >
              <RefreshCw size={13} className={cn(rescoring && 'animate-spin')} />
            </button>
          )}
          {expanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-brand-500/10">
          {/* Score rings row */}
          <div className="flex flex-wrap gap-4 pt-4">
            {/* Overall — slightly larger */}
            <ScoreRing
              score={proposal.ai_score}
              size={84}
              strokeWidth={7}
              label="Overall"
            />
            {CATEGORIES.map(({ key, label }) => {
              const val = proposal[key] as number | undefined
              if (val == null) return null
              return (
                <ScoreRing
                  key={key}
                  score={val}
                  size={72}
                  label={label}
                />
              )
            })}
          </div>

          {/* Category hints */}
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(({ key, label, hint }) => {
              const val = proposal[key] as number | undefined
              if (val == null) return null
              return (
                <div key={key} className="flex flex-col gap-0.5 text-xs">
                  <span className="font-medium text-foreground/70">{label}</span>
                  <span className="text-muted-foreground">{hint}</span>
                </div>
              )
            })}
          </div>

          {/* AI feedback text */}
          {proposal.ai_feedback && (
            <div className="rounded-lg bg-brand-500/10 border border-brand-500/15 px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-brand-300 text-xs font-semibold">
                <Lightbulb size={13} />
                AI Feedback
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {proposal.ai_feedback}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
