/**
 * /dashboard/skills — M8
 * Skill catalogue grid, start-test flow, results panel, badge display.
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Lock, Play, RefreshCw, Trophy, Sparkles,
} from 'lucide-react'
import { useSkillStore } from '@/store/skillStore'
import { skillsApi, SkillCatalogueItem, TestStartResponse, TestSubmitResponse } from '@/api/skills'
import { SkillTestModal } from '@/components/skills/SkillTestModal'
import { BadgeAward } from '@/components/skills/BadgeAward'
import { VerifiedBadge } from '@/components/skills/VerifiedBadge'
import { cn } from '@/lib/utils'

// ── SkillCard ──────────────────────────────────────────────────────────────────

interface SkillCardProps {
  skill:        SkillCatalogueItem
  bestBadge:    'bronze' | 'silver' | 'gold' | null
  onStart:      (skill: SkillCatalogueItem) => void
  starting:     boolean
}

const BADGE_RANK = { bronze: 1, silver: 2, gold: 3 }

function SkillCard({ skill, bestBadge, onStart, starting }: SkillCardProps) {
  const hasGold = bestBadge === 'gold'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      className={cn(
        'rounded-xl border p-5 flex flex-col gap-4 transition-colors',
        hasGold
          ? 'border-yellow-400/30 bg-yellow-400/5'
          : bestBadge
          ? 'border-white/10 bg-surface-1'
          : 'border-white/8 bg-surface-1 hover:border-white/15',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{skill.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{skill.label}</h3>
            {bestBadge && (
              <VerifiedBadge
                level={bestBadge}
                label={bestBadge.charAt(0).toUpperCase() + bestBadge.slice(1)}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {skill.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{skill.question_count} question bank · 20 MCQs · 20 min</span>
        {bestBadge && (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle2 size={11} />
            Verified
          </span>
        )}
      </div>

      <button
        onClick={() => onStart(skill)}
        disabled={starting || hasGold}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
          hasGold
            ? 'bg-yellow-400/10 text-yellow-400/60 cursor-not-allowed border border-yellow-400/20'
            : 'bg-brand-500 hover:bg-brand-600 text-white',
          starting && 'opacity-60',
        )}
      >
        {starting ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : hasGold ? (
          <><Lock size={14} /> Gold achieved</>
        ) : bestBadge ? (
          <><RefreshCw size={14} /> Retake to improve</>
        ) : (
          <><Play size={14} /> Start Test</>
        )}
      </button>
    </motion.div>
  )
}

// ── Results panel (no badge earned) ──────────────────────────────────────────

interface ResultsPanelProps {
  result: TestSubmitResponse
  onClose: () => void
}

function ResultsPanel({ result, onClose }: ResultsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="bg-surface-1 border border-white/10 rounded-2xl p-8 text-center max-w-sm w-full"
      >
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-xl font-bold mb-1">{result.skill_label} Test Complete</h2>
        <p className="text-muted-foreground text-sm mb-5">You didn't reach the 60% threshold for a badge.</p>

        <div className="rounded-xl bg-white/5 border border-white/8 px-6 py-4 mb-5">
          <p className="text-4xl font-bold text-foreground">{result.score_pct.toFixed(0)}%</p>
          <p className="text-sm text-muted-foreground mt-1">{result.correct} / {result.total} correct</p>
        </div>

        <div className="text-xs text-muted-foreground mb-5 space-y-1">
          <p>Bronze ≥ 60% · Silver ≥ 75% · Gold ≥ 90%</p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Try Again
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SkillsPage() {
  const { catalogue, catalogueLoading, verified, fetchCatalogue, fetchVerified, addVerified } = useSkillStore()

  const [startingSkill, setStartingSkill] = useState<string | null>(null)
  const [activeTest,    setActiveTest]    = useState<TestStartResponse | null>(null)
  const [testResult,    setTestResult]    = useState<TestSubmitResponse | null>(null)
  const [showBadge,     setShowBadge]     = useState(false)

  useEffect(() => {
    fetchCatalogue()
    fetchVerified()
  }, [])

  // Best badge per skill_key
  const bestBadges = verified.reduce<Record<string, 'bronze' | 'silver' | 'gold'>>((acc, v) => {
    if (!v.badge_level) return acc
    const current = acc[v.skill_key]
    if (!current || BADGE_RANK[v.badge_level] > BADGE_RANK[current]) {
      acc[v.skill_key] = v.badge_level
    }
    return acc
  }, {})

  const handleStart = async (skill: SkillCatalogueItem) => {
    setStartingSkill(skill.key)
    try {
      const data = await skillsApi.startTest(skill.key)
      setActiveTest(data)
    } catch {
      // TODO: toast error
    } finally {
      setStartingSkill(null)
    }
  }

  const handleComplete = (result: TestSubmitResponse) => {
    setActiveTest(null)
    setTestResult(result)
    if (result.badge) {
      // Add to store
      addVerified({
        id:           result.verification_id,
        skill_key:    result.skill_key,
        skill_label:  result.skill_label,
        score_pct:    result.score_pct,
        badge_level:  result.badge,
        completed_at: result.completed_at,
      })
      setShowBadge(true)
    }
  }

  const totalBadges = verified.filter(v => v.badge_level).length

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Skill Verification</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Take a 20-question test to earn a verified badge and stand out on your profile.
          </p>
        </div>
        {totalBadges > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 border border-white/8 rounded-xl px-4 py-2.5">
            <Trophy size={15} className="text-yellow-400" />
            <span>{totalBadges} badge{totalBadges !== 1 ? 's' : ''} earned</span>
          </div>
        )}
      </div>

      {/* Badge thresholds legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { badge: 'bronze' as const, threshold: '≥ 60%' },
          { badge: 'silver' as const, threshold: '≥ 75%' },
          { badge: 'gold'   as const, threshold: '≥ 90%' },
        ].map(({ badge, threshold }) => (
          <div key={badge} className="flex items-center gap-1.5">
            <VerifiedBadge level={badge} />
            <span className="text-muted-foreground">{threshold}</span>
          </div>
        ))}
      </div>

      {/* Catalogue grid */}
      {catalogueLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogue.map(skill => (
            <SkillCard
              key={skill.key}
              skill={skill}
              bestBadge={bestBadges[skill.key] ?? null}
              onStart={handleStart}
              starting={startingSkill === skill.key}
            />
          ))}
        </div>
      )}

      {/* Empty verified state */}
      {!catalogueLoading && catalogue.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p>No skill tests available yet.</p>
        </div>
      )}

      {/* Active test modal */}
      <AnimatePresence>
        {activeTest && (
          <SkillTestModal
            testData={activeTest}
            onComplete={handleComplete}
            onClose={() => setActiveTest(null)}
          />
        )}
      </AnimatePresence>

      {/* Badge award celebration */}
      <AnimatePresence>
        {showBadge && testResult?.badge && (
          <BadgeAward
            badge={testResult.badge}
            skillLabel={testResult.skill_label}
            scorePct={testResult.score_pct}
            correct={testResult.correct}
            total={testResult.total}
            onContinue={() => {
              setShowBadge(false)
              setTestResult(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* No-badge result panel */}
      <AnimatePresence>
        {testResult && !showBadge && !testResult.badge && (
          <ResultsPanel result={testResult} onClose={() => setTestResult(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
