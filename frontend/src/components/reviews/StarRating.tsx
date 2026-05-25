import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number          // current value (0–5)
  onChange?: (v: number) => void
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
}

const SIZE = { sm: 14, md: 20, lg: 28 }

export function StarRating({ value, onChange, size = 'md', readOnly = false }: StarRatingProps) {
  const px = SIZE[size]
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-transform',
            !readOnly && 'hover:scale-110 cursor-pointer',
            readOnly && 'cursor-default',
          )}
        >
          <Star
            width={px}
            height={px}
            className={cn(
              'transition-colors',
              star <= value ? 'fill-amber-400 stroke-amber-400' : 'fill-transparent stroke-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  )
}
