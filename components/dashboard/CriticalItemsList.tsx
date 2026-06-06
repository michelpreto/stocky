// components/dashboard/CriticalItemsList.tsx
import { cn } from '@/lib/utils'
import type { CriticalItem } from '@/types/dashboard'

function getBarColor(pct: number): string {
  if (pct < 25) return 'bg-danger shadow-[0_0_4px_hsl(var(--color-danger)/0.4)]'
  if (pct < 50) return 'bg-warning'
  return 'bg-success'
}

function getQtyColor(pct: number): string {
  if (pct < 25) return 'text-danger'
  if (pct < 50) return 'text-warning'
  return 'text-success'
}

interface Props {
  items: CriticalItem[]
}

export function CriticalItemsList({ items }: Props) {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Itens Críticos</p>
        <span className="text-[11px] text-muted-foreground">saldo vs. mínimo</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => {
          const pct = item.estoqueMinimo > 0
            ? Math.round((item.estoqueAtual / item.estoqueMinimo) * 100)
            : 0
          return (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-foreground font-medium truncate max-w-[140px]">
                  {item.nome}
                </span>
                <span className={cn('font-mono text-[10px]', getQtyColor(pct))}>
                  {item.estoqueAtual} / {item.estoqueMinimo} {item.unidade}
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', getBarColor(pct))}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
