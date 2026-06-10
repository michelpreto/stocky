// app/(dashboard)/fornecedores/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Users, Edit2, ToggleLeft, ToggleRight, Loader2, Phone, Mail, Contact } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface Fornecedor {
  id: string
  nome: string
  contato?: string
  telefone?: string
  email?: string
  ativo: boolean
  createdAt: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function FornecedoresPage() {
  const [items, setItems] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Fornecedor | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', contato: '', telefone: '', email: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      const res = await fetch(`/api/fornecedores?${params}`)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => { load() }, [load])

  function openNew() {
    setSaveError(null)
    setEditTarget(null)
    setForm({ nome: '', contato: '', telefone: '', email: '' })
    setSheetOpen(true)
  }

  function openEdit(f: Fornecedor) {
    setSaveError(null)
    setEditTarget(f)
    setForm({ nome: f.nome, contato: f.contato ?? '', telefone: f.telefone ?? '', email: f.email ?? '' })
    setSheetOpen(true)
  }

  async function handleSave() {
    setSaveError(null)
    if (!form.nome || form.nome.trim().length < 2) {
      setSaveError('Nome deve ter pelo menos 2 caracteres.')
      return
    }
    if (form.email && !isValidEmail(form.email)) {
      setSaveError('E-mail inválido.')
      return
    }
    setSaving(true)
    try {
      const body = {
        nome: form.nome.trim(),
        contato: form.contato.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        email: form.email.trim() || undefined,
      }
      const res = editTarget
        ? await fetch(`/api/fornecedores/${editTarget.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/fornecedores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setSheetOpen(false)
        load()
      } else {
        const b = await res.json().catch(() => ({}))
        setSaveError(b?.error ?? `Erro ${res.status}`)
      }
    } catch {
      setSaveError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(f: Fornecedor) {
    await fetch(`/api/fornecedores/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !f.ativo }),
    })
    load()
  }

  const ativo = items.filter(i => i.ativo).length

  return (
    <div className="p-5 flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Fornecedores</h1>
          <span className="text-[11px] text-muted-foreground bg-surface-elevated px-2 py-0.5 rounded-full">{items.length}</span>
          {!loading && <span className="text-[11px] text-success bg-success/15 px-2 py-0.5 rounded-full">{ativo} ativo{ativo !== 1 ? 's' : ''}</span>}
        </div>
        <button onClick={openNew} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Novo Fornecedor
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar fornecedor..."
            className="h-8 pl-8 pr-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Nome</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Contato</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Telefone</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">E-mail</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-3 py-2"><div className="animate-pulse bg-surface-elevated rounded h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="w-8 h-8 opacity-30" />
                    <span className="text-[12px]">Nenhum fornecedor cadastrado</span>
                  </div>
                </td>
              </tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-t border-border hover:bg-surface-elevated transition-colors">
                <td className="px-3 py-2 text-[12px] text-foreground font-medium">{item.nome}</td>
                <td className="px-3 py-2 text-[12px] text-muted-foreground">
                  {item.contato ? (
                    <span className="flex items-center gap-1"><Contact className="w-3 h-3" />{item.contato}</span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 text-[12px] text-muted-foreground">
                  {item.telefone ? (
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{item.telefone}</span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 text-[12px] text-muted-foreground">
                  {item.email ? (
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{item.email}</span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', item.ativo ? 'bg-success/15 text-success' : 'bg-surface-elevated text-muted-foreground')}>
                    {item.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(item)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleAtivo(item)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {item.ativo ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[420px]">
          <SheetHeader>
            <SheetTitle className="text-sm font-semibold">{editTarget ? 'Editar Fornecedor' : 'Novo Fornecedor'}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-6 px-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Nome *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome do fornecedor"
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Contato (opcional)</label>
              <input value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
                placeholder="Nome do contato"
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Telefone (opcional)</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">E-mail (opcional)</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="contato@fornecedor.com"
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
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
                {editTarget ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
