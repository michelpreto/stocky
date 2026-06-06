// components/dashboard/AlertList.tsx
import { cn } from '@/lib/utils'
import type { AlertItem, AlertSeverity } from '@/types/dashboard'
import { CheckCircle2 } from 'lucide-react'

const severityConfig: Record<AlertSeverity, {
  border: string; bg: string; dot: string; glow?: string
}> = {
  CRITICO: {
    border: 'border-l-danger',
    bg:     'bg-danger/5',
    dot:    'bg-danger',
    glow:   'shadow-[0_0_5px_hsl(var(--color-danger)/0.5)]',
  },
  ALERTA: {
    border: 'border-l-warning',
    bg:     'bg-warning/5',
    dot:    'bg-warning',
  },
  INFO: {
    border: 'border-l-primary',
    bg:     'bg-primary/5',
    dot:    'bg-primary',
  },
}

interface Props {
  alerts: AlertItem[]
}

export function AlertList({ alerts }: Props) {
  const criticalCount = alerts.filter((a) => a.severidade === 'CRITICO').length

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-2.5 flex-shrink-0">
        <p className="text-sm font-semibold text-foreground">Alertas</p>
        {criticalCount > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">
            {criticalCount} {criticalCount === 1 ? 'crítico' : 'críticos'}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-muted-foreground">
          <CheckCircle2 size={28} className="text-success" />
          <span className="text-sm">Tudo em ordem</span>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
          {alerts.map((alert) => {
            const cfg = severityConfig[alert.severidade]
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-2 px-2.5 py-2 rounded-md border-l-2 cursor-pointer',
                  'transition-colors hover:bg-surface-elevated',
                  cfg.border, cfg.bg
                )}
              >
                <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5', cfg.dot, cfg.glow)} />
                <div>
                  <p className="text-[11px] text-foreground leading-snug">{alert.mensagem}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{alert.meta}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
