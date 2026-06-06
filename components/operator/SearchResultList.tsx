// components/operator/SearchResultList.tsx
'use client'

import { cn } from '@/lib/utils'
import type { SearchResult } from '@/types/operator'

function stockColor(item: SearchResult): string {
  if (item.estoqueAtual === 0) return 'text-danger'
  if (item.estoqueAtual < item.estoqueMinimo) return 'text-warning'
  return 'text-success'
}

interface Props {
  results: SearchResult[]
  onSelect: (item: SearchResult) => void
  query?: string
  isOffline?: boolean
}

export function SearchResultList({ results, onSelect, query = '', isOffline = false }: Props) {
  if (results.length === 0 && !query) return null

  if (results.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
        Nenhum item encontrado — tente o código completo
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-3">
      {results.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="w-full flex items-center justify-between bg-surface-elevated border border-border rounded-xl px-3 py-3 min-h-[48px] hover:border-primary/50 transition-colors text-left"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{item.nome}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cód. {item.codigoInterno} · {item.categoria}
              {isOffline && <span className="text-warning ml-1">· cache</span>}
            </p>
          </div>
          <span className={cn('font-mono text-sm font-bold ml-3 flex-shrink-0', stockColor(item))}>
            {isOffline ? '~' : ''}{item.estoqueAtual} {item.unidade}
          </span>
        </button>
      ))}
    </div>
  )
}
