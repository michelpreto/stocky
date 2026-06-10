// app/(dashboard)/compras/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, ShoppingBag, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'

interface EntradaItem {
  id: string
  tipo: 'ENTRADA'
  quantidade: number
  estoqueDepois: number
  observacao?: string
  createdAt: string
  product: { id: string; nome: string; unidadeConsumo: string }
  user: { id: string; nome: string }
  warehouse: { id: string; nome: string }
}

interface Product { id: string; nome: string }

export default function ComprasPage() {
  const [items, setItems] = useState<EntradaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [produtos, setProdutos] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [defaultWarehouse, setDefaultWarehouse] = useState<{ id: string; nome: string } | null>(null)
  const [form, setForm] = useState({ productId: '', warehouseId: '', quantidade: '', observacao: '' })

  const limit = 25

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ q, tipo: 'ENTRADA', page: String(page), limit: String(limit) })
      const res = await fetch(`/api/movimentacoes?${params}`)
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [q, page])

  useEffect(() => { load() }, [load])

  async function openSheet() {
    setSaveError(null)
    setSheetOpen(true)
    const [prods, wh] = await Promise.all([
      fetch('/api/produtos?ativo=true').then(r => r.json()).catch(() => []),
      fetch('/api/warehouses/default').then(r => r.json()).catch(() => null),
    ])
    setProdutos(prods)
    setDefaultWarehouse(wh)
    setForm({ productId: '', warehouseId: wh?.id ?? '', quantidade: '', observacao: '' })
  }

  async function handleSave() {
    setSaveError(null)
    if (!form.productId || !form.warehouseId || !form.quantidade) {
      setSaveError('Preencha produto, almoxarifado e quantidade.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          warehouseId: form.warehouseId,
          tipo: 'ENTRADA',
          quantidade: parseFloat(form.quantidade),
          observacao: form.observacao || undefined,
        }),
      })
      if (res.ok) {
        setSheetOpen(false)
        setPage(1)
        load()
      } else {
        const body = await res.json().catch(() => ({}))
        setSaveError(body?.error ?? `Erro ${res.status}`)
      }
    } catch {
      setSaveError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="p-5 flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Entradas de Estoque</h1>
          <span className="text-[11px] text-muted-foreground bg-surface-elevated px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <button onClick={openSheet} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Registrar Entrada
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="Buscar produto..."
            className="h-8 pl-8 pr-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Data/Hora</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Produto</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Quantidade</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Estoque Resultante</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Almoxarifado</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Registrado por</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Observação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-3 py-2"><div className="animate-pulse bg-surface-elevated rounded h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ShoppingBag className="w-8 h-8 opacity-30" />
                    <span className="text-[12px]">Nenhuma entrada registrada</span>
                  </div>
                </td>
              </tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-t border-border hover:bg-surface-elevated transition-colors">
                <td className="px-3 py-2 text-[12px] text-foreground whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-3 py-2 text-[12px] text-foreground">{item.product.nome}</td>
                <td className="px-3 py-2 text-[12px] text-foreground">{item.quantidade} {item.product.unidadeConsumo}</td>
                <td className="px-3 py-2 text-[12px] text-foreground">{item.estoqueDepois} {item.product.unidadeConsumo}</td>
                <td className="px-3 py-2 text-[12px] text-foreground">{item.warehouse.nome}</td>
                <td className="px-3 py-2 text-[12px] text-foreground">{item.user.nome}</td>
                <td className="px-3 py-2 text-[12px] text-muted-foreground">{item.observacao ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[12px] text-muted-foreground">
        <span>{total} entrada{total !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="h-7 w-7 rounded border border-border flex items-center justify-center hover:border-slate-600 disabled:opacity-40 cursor-pointer transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="h-7 w-7 rounded border border-border flex items-center justify-center hover:border-slate-600 disabled:opacity-40 cursor-pointer transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[420px]">
          <SheetHeader>
            <SheetTitle className="text-sm font-semibold">Registrar Entrada</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-6 px-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Produto *</label>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring cursor-pointer w-full">
                <option value="">Selecionar produto...</option>
                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Almoxarifado</label>
              <input value={defaultWarehouse?.nome ?? '—'} readOnly
                className="h-8 px-2.5 rounded-lg border border-border bg-surface-elevated text-[12px] text-muted-foreground w-full cursor-not-allowed" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Quantidade *</label>
              <input type="number" min="0.001" step="0.001" value={form.quantidade}
                onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                placeholder="0"
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Observação (opcional)</label>
              <textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                placeholder="Adicionar observação..." rows={3}
                className="px-2.5 py-2 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full resize-none" />
            </div>
          </div>
          <SheetFooter className="mt-6 flex flex-col gap-2">
            {saveError && <p className="text-[11px] text-danger text-center">{saveError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSheetOpen(false)}
                className="h-8 px-3 rounded-lg border border-border text-[12px] text-muted-foreground hover:border-slate-600 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Registrar
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
