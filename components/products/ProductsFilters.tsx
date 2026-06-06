'use client'

import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { Category, StockStatus } from '@/types/product'

export interface ActiveFilter {
  key: string
  label: string
}

interface Props {
  query: string
  onQueryChange: (v: string) => void
  categoryId: string
  onCategoryChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
  categories: Category[]
  activeFilters: ActiveFilter[]
  onClearFilter: (key: string) => void
}

const STATUS_OPTIONS: { value: StockStatus | ''; label: string }[] = [
  { value: '',         label: 'Todos os status' },
  { value: 'normal',   label: 'Normal'           },
  { value: 'baixo',    label: 'Baixo'            },
  { value: 'critico',  label: 'Crítico'          },
  { value: 'zerado',   label: 'Zerado'           },
  { value: 'rascunho', label: 'Rascunho'         },
]

export function ProductsFilters({
  query, onQueryChange,
  categoryId, onCategoryChange,
  statusFilter, onStatusChange,
  categories, activeFilters, onClearFilter,
}: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQueryChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onQueryChange(value), 200)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            defaultValue={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Buscar por nome, código..."
            aria-label="Buscar produtos"
            className="h-8 pl-8 pr-3 w-56 rounded-lg border border-border bg-card text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-colors"
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filtrar por categoria"
          className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] text-foreground focus:outline-none focus:border-ring cursor-pointer transition-colors"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filtrar por status"
          className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] text-foreground focus:outline-none focus:border-ring cursor-pointer transition-colors"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => onClearFilter(f.key)}
              className="flex items-center gap-1 h-6 px-2 rounded-full border border-border bg-surface-elevated text-[10px] text-muted-foreground hover:border-slate-600 hover:text-foreground transition-colors cursor-pointer"
            >
              {f.label}
              <X size={9} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
