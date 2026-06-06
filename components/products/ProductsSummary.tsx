'use client'

import { useMemo } from 'react'
import { getStockStatus } from '@/types/product'
import type { Product } from '@/types/product'

interface Props {
  total: number
  filtered: Product[]
}

export function ProductsSummary({ total, filtered }: Props) {
  const counts = useMemo(() => {
    let criticos = 0
    let baixo = 0
    for (const p of filtered) {
      const s = getStockStatus(p)
      if (s === 'critico' || s === 'zerado') criticos++
      else if (s === 'baixo') baixo++
    }
    return { criticos, baixo }
  }, [filtered])

  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      <span>
        {filtered.length < total
          ? <><span className="font-mono">{filtered.length}</span> de <span className="font-mono">{total}</span> produtos</>
          : <><span className="font-mono">{total}</span> produtos</>}
      </span>
      {counts.criticos > 0 && (
        <span className="text-danger font-medium font-mono">
          {counts.criticos} crítico{counts.criticos > 1 ? 's' : ''}
        </span>
      )}
      {counts.baixo > 0 && (
        <span className="text-warning font-medium font-mono">
          {counts.baixo} baixo estoque
        </span>
      )}
    </div>
  )
}
