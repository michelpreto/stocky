// components/dashboard/MovementsTable.tsx
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { MovementRow, MovementType } from '@/types/dashboard'

const typeBadge: Record<MovementType, { label: string; classes: string }> = {
  ENTRADA:       { label: '↑ Entrada',       classes: 'bg-success/10 text-success border-success/20'        },
  SAIDA:         { label: '↓ Saída',         classes: 'bg-danger/10 text-danger border-danger/20'            },
  AJUSTE:        { label: '⟳ Ajuste',        classes: 'bg-primary/10 text-primary border-primary/20'        },
  TRANSFERENCIA: { label: '⇄ Transferência', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
}

function formatQty(quantidade: number, unidade: string): { text: string; color: string } {
  if (quantidade > 0) return { text: `+${quantidade} ${unidade}`, color: 'text-success' }
  return { text: `−${Math.abs(quantidade)} ${unidade}`, color: 'text-danger' }
}

interface Props {
  movements: MovementRow[]
}

export function MovementsTable({ movements }: Props) {
  return (
    <div className="bg-card border border-border rounded-lg flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-foreground">Últimas Movimentações</p>
          <p className="text-[11px] text-muted-foreground">Hoje</p>
        </div>
        <span className="text-[11px] text-primary cursor-pointer hover:underline">Ver todas →</span>
      </div>
      <div className="overflow-y-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Tipo</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Item</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Qtd</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Hora</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((mov) => {
              const badge = typeBadge[mov.tipo]
              const qty   = formatQty(mov.quantidade, mov.unidade)
              return (
                <TableRow key={mov.id} className="border-border hover:bg-surface-elevated transition-colors">
                  <TableCell className="px-3 py-1.5">
                    <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border', badge.classes)}>
                      {badge.label}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-1.5 text-[11px] text-foreground">{mov.itemNome}</TableCell>
                  <TableCell className={cn('px-3 py-1.5 font-mono text-[11px]', qty.color)}>{qty.text}</TableCell>
                  <TableCell className="px-3 py-1.5 text-[11px] text-muted-foreground">{mov.hora}</TableCell>
                  <TableCell className="px-3 py-1.5 text-[11px] text-muted-foreground">{mov.usuario}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
