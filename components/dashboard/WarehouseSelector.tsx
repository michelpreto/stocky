// components/dashboard/WarehouseSelector.tsx
'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Warehouse } from '@/types/dashboard'

interface Props {
  warehouses: Warehouse[]
  selected: Warehouse
  onChange: (w: Warehouse) => void
}

export function WarehouseSelector({ warehouses, selected, onChange }: Props) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-[12px] text-slate-300 cursor-pointer hover:border-slate-600 transition-colors">
        <span className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          selected.online ? 'bg-success shadow-[0_0_4px_hsl(var(--color-success)/0.6)]' : 'bg-muted-foreground'
        )} />
        {selected.nome}
        <ChevronDown size={12} className="text-muted-foreground" />
      </button>
      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[200px] hidden group-focus-within:block z-50">
        {warehouses.map((w) => (
          <button
            key={w.id}
            onClick={() => onChange(w)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-surface-elevated transition-colors',
              w.id === selected.id ? 'text-primary' : 'text-foreground'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', w.online ? 'bg-success' : 'bg-muted-foreground')} />
            {w.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
