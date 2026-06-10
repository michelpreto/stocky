// app/(dashboard)/configuracoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Settings, Loader2, Edit2, Trash2, ToggleLeft, ToggleRight, Plus } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface OrgData { id: string; nome: string; slug: string }
interface UserData { id: string; nome: string; email: string; role: string; ativo: boolean; createdAt: string }
interface WarehouseData { id: string; nome: string; descricao?: string; ativo: boolean; createdAt: string }
interface CategoryData { id: string; nome: string; cor: string; createdAt: string }

function roleBadge(role: string) {
  if (role === 'ADMIN') return 'bg-primary/15 text-primary'
  if (role === 'OPERATOR') return 'bg-purple-500/15 text-purple-400'
  return 'bg-surface-elevated text-muted-foreground'
}

export default function ConfiguracoesPage() {
  const [org, setOrg] = useState<OrgData | null>(null)
  const [orgNome, setOrgNome] = useState('')
  const [orgSaving, setOrgSaving] = useState(false)
  const [orgMsg, setOrgMsg] = useState<string | null>(null)

  const [users, setUsers] = useState<UserData[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])

  const [sheetType, setSheetType] = useState<'user' | 'warehouse' | 'category' | null>(null)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [userForm, setUserForm] = useState({ nome: '', email: '', password: '', role: 'OPERATOR' })
  const [warehouseForm, setWarehouseForm] = useState({ nome: '', descricao: '' })
  const [categoryForm, setCategoryForm] = useState({ nome: '', cor: '#6366f1' })

  useEffect(() => {
    fetch('/api/config/organization').then(r => r.json()).then(d => { setOrg(d); setOrgNome(d.nome) }).catch(() => null)
    fetch('/api/config/users').then(r => r.json()).then(setUsers).catch(() => [])
    fetch('/api/config/warehouses').then(r => r.json()).then(setWarehouses).catch(() => [])
    fetch('/api/config/categories').then(r => r.json()).then(setCategories).catch(() => [])
  }, [])

  async function saveOrg() {
    setOrgSaving(true); setOrgMsg(null)
    try {
      const res = await fetch('/api/config/organization', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: orgNome }) })
      if (res.ok) { setOrgMsg('Salvo com sucesso!') } else { setOrgMsg('Erro ao salvar.') }
    } finally { setOrgSaving(false) }
  }

  function openNewUser() { setSaveError(null); setEditTarget(null); setUserForm({ nome: '', email: '', password: '', role: 'OPERATOR' }); setSheetType('user') }
  function openEditUser(u: UserData) { setSaveError(null); setEditTarget(u); setUserForm({ nome: u.nome, email: u.email, password: '', role: u.role }); setSheetType('user') }

  async function saveUser() {
    setSaveError(null)
    if (!userForm.nome || !userForm.email) { setSaveError('Nome e e-mail são obrigatórios.'); return }
    if (!editTarget && !userForm.password) { setSaveError('Senha é obrigatória para novos usuários.'); return }
    setSaving(true)
    try {
      const body: any = { nome: userForm.nome, email: userForm.email, role: userForm.role }
      if (userForm.password) body.password = userForm.password
      const res = editTarget
        ? await fetch(`/api/config/users/${editTarget.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/config/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setSheetType(null); fetch('/api/config/users').then(r => r.json()).then(setUsers) }
      else { const b = await res.json().catch(() => ({})); setSaveError(b?.error ?? `Erro ${res.status}`) }
    } catch { setSaveError('Erro de conexão.') } finally { setSaving(false) }
  }

  async function toggleUser(u: UserData) {
    await fetch(`/api/config/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !u.ativo }) })
    fetch('/api/config/users').then(r => r.json()).then(setUsers)
  }

  function openNewWarehouse() { setSaveError(null); setEditTarget(null); setWarehouseForm({ nome: '', descricao: '' }); setSheetType('warehouse') }
  function openEditWarehouse(w: WarehouseData) { setSaveError(null); setEditTarget(w); setWarehouseForm({ nome: w.nome, descricao: w.descricao ?? '' }); setSheetType('warehouse') }

  async function saveWarehouse() {
    setSaveError(null)
    if (!warehouseForm.nome) { setSaveError('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      const body = { nome: warehouseForm.nome, descricao: warehouseForm.descricao || undefined }
      const res = editTarget
        ? await fetch(`/api/config/warehouses/${editTarget.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/config/warehouses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setSheetType(null); fetch('/api/config/warehouses').then(r => r.json()).then(setWarehouses) }
      else { const b = await res.json().catch(() => ({})); setSaveError(b?.error ?? `Erro ${res.status}`) }
    } catch { setSaveError('Erro de conexão.') } finally { setSaving(false) }
  }

  async function toggleWarehouse(w: WarehouseData) {
    await fetch(`/api/config/warehouses/${w.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !w.ativo }) })
    fetch('/api/config/warehouses').then(r => r.json()).then(setWarehouses)
  }

  async function deleteWarehouse(id: string) {
    await fetch(`/api/config/warehouses/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    fetch('/api/config/warehouses').then(r => r.json()).then(setWarehouses)
  }

  function openNewCategory() { setSaveError(null); setEditTarget(null); setCategoryForm({ nome: '', cor: '#6366f1' }); setSheetType('category') }
  function openEditCategory(c: CategoryData) { setSaveError(null); setEditTarget(c); setCategoryForm({ nome: c.nome, cor: c.cor }); setSheetType('category') }

  async function saveCategory() {
    setSaveError(null)
    if (!categoryForm.nome) { setSaveError('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      const body = { nome: categoryForm.nome, cor: categoryForm.cor }
      const res = editTarget
        ? await fetch(`/api/config/categories/${editTarget.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/config/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setSheetType(null); fetch('/api/config/categories').then(r => r.json()).then(setCategories) }
      else { const b = await res.json().catch(() => ({})); setSaveError(b?.error ?? `Erro ${res.status}`) }
    } catch { setSaveError('Erro de conexão.') } finally { setSaving(false) }
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/config/categories/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    fetch('/api/config/categories').then(r => r.json()).then(setCategories)
  }

  return (
    <div className="p-5 flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue="organizacao">
        <TabsList className="mb-4">
          <TabsTrigger value="organizacao" className="text-[12px]">Organização</TabsTrigger>
          <TabsTrigger value="usuarios" className="text-[12px]">Usuários</TabsTrigger>
          <TabsTrigger value="almoxarifados" className="text-[12px]">Almoxarifados</TabsTrigger>
          <TabsTrigger value="categorias" className="text-[12px]">Categorias</TabsTrigger>
        </TabsList>

        {/* Tab Organização */}
        <TabsContent value="organizacao">
          <div className="bg-card border border-border rounded-lg p-5 max-w-md flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-foreground">Informações da Organização</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Nome da Organização</label>
              <input value={orgNome} onChange={e => setOrgNome(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
            </div>
            {org?.slug && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-medium">Slug</label>
                <input value={org.slug} readOnly
                  className="h-8 px-2.5 rounded-lg border border-border bg-surface-elevated text-[12px] text-muted-foreground w-full cursor-not-allowed" />
              </div>
            )}
            {orgMsg && <p className="text-[11px] text-success">{orgMsg}</p>}
            <button onClick={saveOrg} disabled={orgSaving}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 self-start disabled:opacity-60">
              {orgSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Salvar alterações
            </button>
          </div>
        </TabsContent>

        {/* Tab Usuários */}
        <TabsContent value="usuarios">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <button onClick={openNewUser} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />Novo Usuário
              </button>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Nome</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">E-mail</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Perfil</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Ações</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-border hover:bg-surface-elevated transition-colors">
                      <td className="px-3 py-2 text-[12px] text-foreground">{u.nome}</td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{u.email}</td>
                      <td className="px-3 py-2">
                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', roleBadge(u.role))}>{u.role}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', u.ativo ? 'bg-success/15 text-success' : 'bg-surface-elevated text-muted-foreground')}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditUser(u)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toggleUser(u)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                            {u.ativo ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab Almoxarifados */}
        <TabsContent value="almoxarifados">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <button onClick={openNewWarehouse} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />Novo Almoxarifado
              </button>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Nome</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Descrição</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Ações</th>
                </tr></thead>
                <tbody>
                  {warehouses.map(w => (
                    <tr key={w.id} className="border-t border-border hover:bg-surface-elevated transition-colors">
                      <td className="px-3 py-2 text-[12px] text-foreground">{w.nome}</td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{w.descricao ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', w.ativo ? 'bg-success/15 text-success' : 'bg-surface-elevated text-muted-foreground')}>
                          {w.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditWarehouse(w)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toggleWarehouse(w)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                            {w.ativo ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          {confirmDelete === w.id ? (
                            <button onClick={() => deleteWarehouse(w.id)} className="text-[11px] text-danger font-medium cursor-pointer hover:underline">Confirmar?</button>
                          ) : (
                            <button onClick={() => { setConfirmDelete(w.id); setTimeout(() => setConfirmDelete(null), 3000) }} className="text-muted-foreground hover:text-danger transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab Categorias */}
        <TabsContent value="categorias">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <button onClick={openNewCategory} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />Nova Categoria
              </button>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Cor</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Nome</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Ações</th>
                </tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} className="border-t border-border hover:bg-surface-elevated transition-colors">
                      <td className="px-3 py-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.cor }} />
                      </td>
                      <td className="px-3 py-2 text-[12px] text-foreground">{c.nome}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditCategory(c)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                          {confirmDelete === c.id ? (
                            <button onClick={() => deleteCategory(c.id)} className="text-[11px] text-danger font-medium cursor-pointer hover:underline">Confirmar?</button>
                          ) : (
                            <button onClick={() => { setConfirmDelete(c.id); setTimeout(() => setConfirmDelete(null), 3000) }} className="text-muted-foreground hover:text-danger transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sheet Usuário */}
      <Sheet open={sheetType === 'user'} onOpenChange={v => !v && setSheetType(null)}>
        <SheetContent className="w-[420px]">
          <SheetHeader><SheetTitle className="text-sm font-semibold">{editTarget ? 'Editar Usuário' : 'Novo Usuário'}</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-4 mt-6 px-1">
            {(['nome', 'email'] as const).map(f => (
              <div key={f} className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-medium capitalize">{f === 'nome' ? 'Nome *' : 'E-mail *'}</label>
                <input value={userForm[f]} onChange={e => setUserForm(u => ({ ...u, [f]: e.target.value }))}
                  type={f === 'email' ? 'email' : 'text'}
                  className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Senha {editTarget ? '(deixe em branco para manter)' : '*'}</label>
              <input type="password" value={userForm.password} onChange={e => setUserForm(u => ({ ...u, password: e.target.value }))}
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Perfil *</label>
              <select value={userForm.role} onChange={e => setUserForm(u => ({ ...u, role: e.target.value }))}
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring cursor-pointer w-full">
                <option value="ADMIN">ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="SOLICITANTE">SOLICITANTE</option>
              </select>
            </div>
          </div>
          <SheetFooter className="mt-6 flex flex-col gap-2">
            {saveError && <p className="text-[11px] text-danger text-center">{saveError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSheetType(null)} className="h-8 px-3 rounded-lg border border-border text-[12px] text-muted-foreground hover:border-slate-600 transition-colors cursor-pointer">Cancelar</button>
              <button onClick={saveUser} disabled={saving} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Salvar
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet Almoxarifado */}
      <Sheet open={sheetType === 'warehouse'} onOpenChange={v => !v && setSheetType(null)}>
        <SheetContent className="w-[420px]">
          <SheetHeader><SheetTitle className="text-sm font-semibold">{editTarget ? 'Editar Almoxarifado' : 'Novo Almoxarifado'}</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-4 mt-6 px-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Nome *</label>
              <input value={warehouseForm.nome} onChange={e => setWarehouseForm(f => ({ ...f, nome: e.target.value }))}
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Descrição (opcional)</label>
              <textarea value={warehouseForm.descricao} onChange={e => setWarehouseForm(f => ({ ...f, descricao: e.target.value }))}
                rows={3} className="px-2.5 py-2 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full resize-none" />
            </div>
          </div>
          <SheetFooter className="mt-6 flex flex-col gap-2">
            {saveError && <p className="text-[11px] text-danger text-center">{saveError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSheetType(null)} className="h-8 px-3 rounded-lg border border-border text-[12px] text-muted-foreground hover:border-slate-600 transition-colors cursor-pointer">Cancelar</button>
              <button onClick={saveWarehouse} disabled={saving} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Salvar
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet Categoria */}
      <Sheet open={sheetType === 'category'} onOpenChange={v => !v && setSheetType(null)}>
        <SheetContent className="w-[420px]">
          <SheetHeader><SheetTitle className="text-sm font-semibold">{editTarget ? 'Editar Categoria' : 'Nova Categoria'}</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-4 mt-6 px-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Nome *</label>
              <input value={categoryForm.nome} onChange={e => setCategoryForm(f => ({ ...f, nome: e.target.value }))}
                className="h-8 px-2.5 rounded-lg border border-border bg-card text-[12px] focus:outline-none focus:border-ring w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Cor</label>
              <div className="flex items-center gap-2">
                <input type="color" value={categoryForm.cor} onChange={e => setCategoryForm(f => ({ ...f, cor: e.target.value }))}
                  className="w-10 h-8 rounded-lg border border-border cursor-pointer bg-card p-0.5" />
                <span className="text-[12px] text-muted-foreground">{categoryForm.cor}</span>
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6 flex flex-col gap-2">
            {saveError && <p className="text-[11px] text-danger text-center">{saveError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSheetType(null)} className="h-8 px-3 rounded-lg border border-border text-[12px] text-muted-foreground hover:border-slate-600 transition-colors cursor-pointer">Cancelar</button>
              <button onClick={saveCategory} disabled={saving} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Salvar
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
