// components/dashboard/DonutMini.tsx
import type { CategorySlice } from '@/types/dashboard'

interface DonutMiniProps {
  categories: CategorySlice[]
  size?: number
  strokeWidth?: number
}

export function DonutMini({ categories, size = 56, strokeWidth = 9 }: DonutMiniProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  let offset = 0
  const slices = categories.map((cat) => {
    const dash = (cat.percentual / 100) * circumference
    const gap = circumference - dash
    const slice = { ...cat, dash, gap, offset }
    offset += dash
    return slice
  })

  return (
    <div className="bg-card border border-border rounded-lg p-2 flex flex-col items-center justify-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="hsl(var(--color-border))"
          strokeWidth={strokeWidth}
        />
        {slices.map((s) => (
          <circle
            key={s.nome}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.cor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
      </svg>
      <span className="text-[9px] text-muted-foreground text-center leading-tight">
        Por<br />categoria
      </span>
    </div>
  )
}
