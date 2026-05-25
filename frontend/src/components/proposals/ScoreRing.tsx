import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number          // 0–100
  size?: number          // px, default 72
  strokeWidth?: number   // default 6
  label?: string
  className?: string
  color?: string         // tailwind stroke color class override
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'   // green-500
  if (score >= 60) return '#f59e0b'   // amber-500
  if (score >= 40) return '#f97316'   // orange-500
  return '#ef4444'                    // red-500
}

export function ScoreRing({
  score,
  size = 72,
  strokeWidth = 6,
  label,
  className,
}: ScoreRingProps) {
  const r       = (size - strokeWidth * 2) / 2
  const circ    = 2 * Math.PI * r
  const offset  = circ - (score / 100) * circ
  const cx      = size / 2
  const cy      = size / 2
  const color   = scoreColor(score)

  const circleRef = useRef<SVGCircleElement>(null)

  // Animate dash offset on mount / score change
  useEffect(() => {
    const el = circleRef.current
    if (!el) return
    el.style.transition = 'none'
    el.style.strokeDashoffset = String(circ)
    // Force reflow
    void el.getBoundingClientRect()
    el.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
    el.style.strokeDashoffset = String(offset)
  }, [score, circ, offset])

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            ref={circleRef}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold leading-none" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[11px] text-muted-foreground text-center leading-tight max-w-[72px]">
          {label}
        </span>
      )}
    </div>
  )
}
