// components/dashboard/KpiCard.tsx
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  delta: { text: string; color: string }
  icon: React.ReactNode
  valueColor?: string
}

export function KpiCard({ label, value, delta, icon, valueColor }: KpiCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 cursor-pointer transition-colors hover:border-slate-600">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wide font-medium mb-1.5">
        <span className="text-slate-500">{icon}</span>
        {label}
      </div>
      <div className={cn('font-mono text-xl font-bold text-foreground leading-none mb-1.5', valueColor)}>
        {value}
      </div>
      <div className={cn('text-[11px] flex items-center gap-1', delta.color)}>
        {delta.text}
      </div>
    </div>
  )
}
