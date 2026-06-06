// app/(dashboard)/produtos/page.tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { ProductsHeader }     from '@/components/products/ProductsHeader'
import { ProductsFilters }    from '@/components/products/ProductsFilters'
import { ProductsSummary }    from '@/components/products/ProductsSummary'
import { ProductsTable }      from '@/components/products/ProductsTable'
import { ProductsPagination } from '@/components/products/ProductsPagination'
import { ProductSheet }       from '@/components/products/ProductSheet'
import { filterAndSortProducts, paginate } from '@/lib/filter-products'
import { exportToExcel } from '@/lib/excel'
import { mockProducts, mockCategories } from '@/lib/mock-data/products'
import type { Product } from '@/types/product'
import type { ProductFormValues } from '@/lib/validations/product'
import type { FilterState } from '@/lib/filter-products'
import type { ActiveFilter } from '@/components/products/ProductsFilters'

type PageSize = 10 | 25 | 50

interface PageState {
  filter: FilterState
  page: number
  pageSize: PageSize
  sheetOpen: boolean
  editingProduct: Product | null
}

const DEFAULT_FILTER: FilterState = {
  query: '', categoryId: '', statusFilter: '',
  sortField: 'nome', sortDir: 'asc',
}

export default function ProductsPage() {
  const [state, setState] = useState<PageState>({
    filter: DEFAULT_FILTER,
    page: 1, pageSize: 25,
    sheetOpen: false, editingProduct: null,
  })

  const filtered = useMemo(
    () => filterAndSortProducts(mockProducts, state.filter),
    [state.filter],
  )

  const paginated = useMemo(
    () => paginate(filtered, state.page, state.pageSize),
    [filtered, state.page, state.pageSize],
  )

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = []
    if (state.filter.categoryId) {
      const cat = mockCategories.find((c) => c.id === state.filter.categoryId)
      if (cat) filters.push({ key: 'categoryId', label: cat.nome })
    }
    if (state.filter.statusFilter) {
      filters.push({ key: 'statusFilter', label: state.filter.statusFilter })
    }
    return filters
  }, [state.filter.categoryId, state.filter.statusFilter])

  const setFilter = useCallback((patch: Partial<FilterState>) => {
    setState((s) => ({ ...s, filter: { ...s.filter, ...patch }, page: 1 }))
  }, [])

  function openNew() {
    setState((s) => ({ ...s, sheetOpen: true, editingProduct: null }))
  }

  function openEdit(product: Product) {
    setState((s) => ({ ...s, sheetOpen: true, editingProduct: product }))
  }

  function closeSheet() {
    setState((s) => ({ ...s, sheetOpen: false, editingProduct: null }))
  }

  async function handleSave(_data: ProductFormValues) {
    await new Promise((r) => setTimeout(r, 500))
    closeSheet()
  }

  function clearFilter(key: string) {
    setFilter({ [key]: '' } as Partial<FilterState>)
  }

  return (
    <div className="p-5 flex flex-col gap-4 h-full overflow-auto">
      <ProductsHeader
        total={mockProducts.length}
        onNew={openNew}
        onExport={() => exportToExcel(filtered)}
      />

      <ProductsFilters
        query={state.filter.query}
        onQueryChange={(v) => setFilter({ query: v })}
        categoryId={state.filter.categoryId}
        onCategoryChange={(v) => setFilter({ categoryId: v })}
        statusFilter={state.filter.statusFilter}
        onStatusChange={(v) => setFilter({ statusFilter: v as FilterState['statusFilter'] })}
        categories={mockCategories}
        activeFilters={activeFilters}
        onClearFilter={clearFilter}
      />

      <ProductsSummary total={mockProducts.length} filtered={filtered} />

      <ProductsTable products={paginated} onEdit={openEdit} />

      <ProductsPagination
        page={state.page}
        pageSize={state.pageSize}
        total={filtered.length}
        onPageChange={(p) => setState((s) => ({ ...s, page: p }))}
        onPageSizeChange={(s) => setState((prev) => ({ ...prev, pageSize: s, page: 1 }))}
      />

      <ProductSheet
        open={state.sheetOpen}
        product={state.editingProduct}
        categories={mockCategories}
        onClose={closeSheet}
        onSave={handleSave}
      />
    </div>
  )
}
