// app/(dashboard)/produtos/page.tsx
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { ProductsHeader }        from '@/components/products/ProductsHeader'
import { ProductsFilters }       from '@/components/products/ProductsFilters'
import { ProductsSummary }       from '@/components/products/ProductsSummary'
import { ProductsTable }         from '@/components/products/ProductsTable'
import { ProductsPagination }    from '@/components/products/ProductsPagination'
import { ProductSheet }          from '@/components/products/ProductSheet'
import { ProductsTableSkeleton } from '@/components/products/ProductsTableSkeleton'
import { filterAndSortProducts, paginate } from '@/lib/filter-products'
import { exportToExcel } from '@/lib/excel'
import type { Product, Category } from '@/types/product'
import type { ProductFormValues } from '@/lib/validations/product'
import type { FilterState } from '@/lib/filter-products'
import type { ActiveFilter } from '@/components/products/ProductsFilters'

type PageSize = 10 | 25 | 50

interface PageState {
  filter:         FilterState
  page:           number
  pageSize:       PageSize
  sheetOpen:      boolean
  editingProduct: Product | null
}

const DEFAULT_FILTER: FilterState = {
  query: '', categoryId: '', statusFilter: '',
  sortField: 'nome', sortDir: 'asc',
}

export default function ProductsPage() {
  const [products,   setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saveError,  setSaveError]  = useState<string | null>(null)
  const [state, setState] = useState<PageState>({
    filter: DEFAULT_FILTER,
    page: 1, pageSize: 25,
    sheetOpen: false, editingProduct: null,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/produtos').then(r => r.json()),
      fetch('/api/produtos/categories').then(r => r.json()).catch(() => []),
    ]).then(([prods, cats]) => {
      const mapped = (prods as any[]).map((p: any) => ({
        ...p,
        warehouse: p.productWarehouses?.[0] ?? null,
      }))
      setProducts(mapped)
      setCategories(cats)
    }).finally(() => setLoading(false))
  }, [])

  const filtered  = useMemo(() => filterAndSortProducts(products, state.filter), [products, state.filter])
  const paginated = useMemo(() => paginate(filtered, state.page, state.pageSize), [filtered, state.page, state.pageSize])

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = []
    if (state.filter.categoryId) {
      const cat = categories.find(c => c.id === state.filter.categoryId)
      if (cat) filters.push({ key: 'categoryId', label: cat.nome })
    }
    if (state.filter.statusFilter) filters.push({ key: 'statusFilter', label: state.filter.statusFilter })
    return filters
  }, [state.filter.categoryId, state.filter.statusFilter, categories])

  const setFilter = useCallback((patch: Partial<FilterState>) => {
    setState(s => ({ ...s, filter: { ...s.filter, ...patch }, page: 1 }))
  }, [])

  function openNew()                { setSaveError(null); setState(s => ({ ...s, sheetOpen: true, editingProduct: null })) }
  function openEdit(p: Product)     { setSaveError(null); setState(s => ({ ...s, sheetOpen: true, editingProduct: p })) }
  function closeSheet()             { setSaveError(null); setState(s => ({ ...s, sheetOpen: false, editingProduct: null })) }
  function clearFilter(key: string) { setFilter({ [key]: '' } as Partial<FilterState>) }

  async function handleSave(data: ProductFormValues) {
    setSaveError(null)
    const method = state.editingProduct ? 'PATCH' : 'POST'
    const url    = state.editingProduct
      ? `/api/produtos/${state.editingProduct.id}`
      : '/api/produtos'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const updated = await fetch('/api/produtos').then(r => r.json())
        setProducts(updated.map((p: any) => ({ ...p, warehouse: p.productWarehouses?.[0] ?? null })))
        closeSheet()
      } else {
        const body = await res.json().catch(() => ({}))
        const msg  = body?.details?.[0]?.message ?? body?.error ?? `Erro ${res.status}`
        setSaveError(msg)
      }
    } catch {
      setSaveError('Erro de conexão. Tente novamente.')
    }
  }

  if (loading) return <div className="p-5"><ProductsTableSkeleton /></div>

  return (
    <div className="p-5 flex flex-col gap-4 h-full overflow-auto">
      <ProductsHeader
        total={products.length}
        onNew={openNew}
        onExport={() => exportToExcel(filtered)}
      />
      <ProductsFilters
        query={state.filter.query}
        onQueryChange={v => setFilter({ query: v })}
        categoryId={state.filter.categoryId}
        onCategoryChange={v => setFilter({ categoryId: v })}
        statusFilter={state.filter.statusFilter}
        onStatusChange={v => setFilter({ statusFilter: v as FilterState['statusFilter'] })}
        categories={categories}
        activeFilters={activeFilters}
        onClearFilter={clearFilter}
      />
      <ProductsSummary total={products.length} filtered={filtered} />
      <ProductsTable products={paginated} onEdit={openEdit} />
      <ProductsPagination
        page={state.page}
        pageSize={state.pageSize}
        total={filtered.length}
        onPageChange={p => setState(s => ({ ...s, page: p }))}
        onPageSizeChange={s => setState(p => ({ ...p, pageSize: s, page: 1 }))}
      />
      <ProductSheet
        open={state.sheetOpen}
        product={state.editingProduct}
        categories={categories}
        onClose={closeSheet}
        onSave={handleSave}
        saveError={saveError}
      />
    </div>
  )
}
