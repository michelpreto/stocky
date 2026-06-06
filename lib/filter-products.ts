// lib/filter-products.ts
import type { Product, StockStatus } from '@/types/product'
import { getStockStatus } from '@/types/product'

export interface FilterState {
  query: string
  categoryId: string
  statusFilter: StockStatus | ''
  sortField: 'nome' | 'codigoInterno' | 'estoqueAtual' | 'custoUnitario'
  sortDir: 'asc' | 'desc'
}

export function filterAndSortProducts(
  products: Product[],
  state: FilterState,
): Product[] {
  let result = [...products]

  if (state.query.trim()) {
    const q = state.query.toLowerCase()
    result = result.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.codigoInterno ?? '').toLowerCase().includes(q) ||
        (p.codigoBarras ?? '').includes(q),
    )
  }

  if (state.categoryId) {
    result = result.filter((p) => p.categoryId === state.categoryId)
  }

  if (state.statusFilter) {
    result = result.filter((p) => getStockStatus(p) === state.statusFilter)
  }

  result.sort((a, b) => {
    const va = getSortValue(a, state.sortField)
    const vb = getSortValue(b, state.sortField)
    let cmp: number
    if (typeof va === 'string' && typeof vb === 'string') {
      cmp = va.localeCompare(vb, 'pt-BR')
    } else {
      if (va === vb) return 0
      cmp = va > vb ? 1 : -1
    }
    return state.sortDir === 'asc' ? cmp : -cmp
  })

  return result
}

function getSortValue(p: Product, field: FilterState['sortField']): string | number {
  switch (field) {
    case 'nome':          return p.nome.toLowerCase()
    case 'codigoInterno': return p.codigoInterno ?? ''
    case 'estoqueAtual':  return p.warehouse?.estoqueAtual ?? -1
    case 'custoUnitario': return p.custoUnitario ?? -1
  }
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize)
}
