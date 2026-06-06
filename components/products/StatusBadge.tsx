import { cn } from '@/lib/utils'
import type { StockStatus } from '@/types/product'

const config: Record<StockStatus, { label: string; classes: string }> = {
  normal:   { label: 'Normal',   classes: 'bg-success/10 text-success border-success/20'           },
  baixo:    { label: 'Baixo',    classes: 'bg-warning/10 text-warning border-warning/20'           },
  critico:  { label: 'Crítico',  classes: 'bg-danger/10 text-danger border-danger/20'              },
  zerado:   { label: 'Zerado',   classes: 'bg-muted text-muted-foreground border-border'           },
  rascunho: { label: 'Rascunho', classes: 'bg-surface-elevated text-muted-foreground border-border' },
}

interface Props {
  status: StockStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  const { label, classes } = config[status]
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        classes,
      )}
    >
      {label}
    </span>
  )
}
