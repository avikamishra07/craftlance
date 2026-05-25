/**
 * BadgeAward.tsx — M8
 * Animated badge celebration shown after a test result.
 * Uses framer-motion for the scale pop + particle confetti burst.
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type BadgeLevel = 'bronze' | 'silver' | 'gold'

interface BadgeAwardProps {
  badge:       BadgeLevel
  skillLabel:  string
  scorePct:    number
  correct:     number
  total:       number
  onContinue:  () => void
}

const BADGE_CONFIG: Record<BadgeLevel, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  bronze: { label: 'Bronze',  color: 'text-amber-600',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40', emoji: '🥉' },
  silver: { label: 'Silver',  color: 'text-slate-300',  bg: 'bg-slate-400/15',  border: 'border-slate-400/40', emoji: '🥈' },
  gold:   { label: 'Gold',    color: 'text-yellow-400', bg: 'bg-yellow-400/15', border: 'border-yellow-400/40', emoji: '🥇' },
}

// Simple canvas confetti burst
function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const COLORS = ['#f59e0b', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa']
    const PARTICLES = 120

    interface Particle {
      x: number; y: number
      vx: number; vy: number
      color: string
      r: number
      gravity: number
      alpha: number
    }

    const particles: Particle[] = Array.from({ length: PARTICLES }, () => ({
      x:       canvas.width  / 2,
      y:       canvas.height / 2,
      vx:      (Math.random() - 0.5) * 14,
      vy:      (Math.random() - 0.8) * 12,
      color:   COLORS[Math.floor(Math.random() * COLORS.length)],
      r:       Math.random() * 5 + 3,
      gravity: 0.25 + Math.random() * 0.15,
      alpha:   1,
    }))

    let raf: number
    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      let alive = false
      for (const p of particles) {
        p.x  += p.vx
        p.y  += p.vy
        p.vy += p.gravity
        p.alpha -= 0.012
        if (p.alpha <= 0) continue
        alive = true
        ctx!.save()
        ctx!.globalAlpha = Math.max(0, p.alpha)
        ctx!.fillStyle   = p.color
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      }
      if (alive) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [canvasRef])
}

export function BadgeAward({ badge, skillLabel, scorePct, correct, total, onContinue }: BadgeAwardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useConfetti(canvasRef)
  const cfg = BADGE_CONFIG[badge]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        {/* Canvas confetti layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Card */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1,   opacity: 1, y: 0  }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
          className={cn(
            'relative z-10 rounded-2xl border p-8 text-center shadow-2xl w-full max-w-sm mx-4',
            'bg-surface-1',
            cfg.border,
          )}
        >
          {/* Badge emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0   }}
            transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.2 }}
            className="text-7xl mb-4 select-none"
          >
            {cfg.emoji}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.35 }}
          >
            <p className="text-muted-foreground text-sm mb-1">You've earned a</p>
            <h2 className={cn('text-3xl font-bold mb-1', cfg.color)}>{cfg.label} Badge</h2>
            <p className="text-lg font-semibold text-foreground mb-4">{skillLabel}</p>

            <div className={cn('inline-flex items-center gap-3 px-5 py-3 rounded-xl border text-sm', cfg.bg, cfg.border)}>
              <span className="text-foreground/70">Score</span>
              <span className={cn('text-2xl font-bold', cfg.color)}>{scorePct.toFixed(0)}%</span>
              <span className="text-foreground/50 text-xs">{correct}/{total} correct</span>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.5 }}
            onClick={onContinue}
            className="mt-6 w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            View My Badges
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
