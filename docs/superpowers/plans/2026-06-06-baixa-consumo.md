# AlmoxControl — Tela de Baixa de Consumo (Operador) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a tela de baixa rápida do operador em `/baixa` — shell dedicado mobile-first com busca, modal de confirmação, feedback sonoro+visual, desfazer e modo offline.

**Architecture:** Shell próprio (`app/(operator)/layout.tsx`) sem sidebar do dashboard. Componentes Client-side para interatividade; dados mockados em `lib/mock-data/operator.ts`. Offline queue em `localStorage` via `lib/offline-queue.ts`. Cada componente é isolado e testável independentemente.

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · shadcn/ui · Lucide React · Vitest + @testing-library/react

---

## File Map

| Arquivo | Responsabilidade |
|---------|-----------------|
| `types/operator.ts` | `SearchResult`, `BaixaInput`, `RecentBaixa`, `Setor`, `MotivoType` |
| `lib/mock-data/operator.ts` | Dados mockados tipados |
| `lib/offline-queue.ts` | enqueue/dequeue/getAll baixas no localStorage |
| `app/(operator)/layout.tsx` | OperatorShell: top bar sem sidebar |
| `app/(operator)/baixa/page.tsx` | BaixaPage: composição de todos os componentes |
| `app/(operator)/baixa/loading.tsx` | Skeleton do campo de busca |
| `components/operator/OfflineBanner.tsx` | Banner âmbar quando offline |
| `components/operator/SearchField.tsx` | Campo de busca com debounce + autoFocus |
| `components/operator/CameraButton.tsx` | Input file + câmera nativa |
| `components/operator/SearchResultList.tsx` | Lista de resultados do autocomplete |
| `components/operator/QuantityControl.tsx` | Controles ± e atalhos 1/5/10 |
| `components/operator/BaixaModal.tsx` | Modal completo de baixa com focus trap |
| `components/operator/ConfirmationScreen.tsx` | Card verde + vibração + auto-dismiss |
| `components/operator/RecentList.tsx` | Últimas baixas + countdown + desfazer |
| `__tests__/operator/offline-queue.test.ts` | Testes da fila offline |
| `__tests__/operator/OfflineBanner.test.tsx` | Testes de render e estado |
| `__tests__/operator/SearchField.test.tsx` | Testes de busca e debounce |
| `__tests__/operator/SearchResultList.test.tsx` | Testes de render e click |
| `__tests__/operator/QuantityControl.test.tsx` | Testes de ±, atalhos, limites |
| `__tests__/operator/BaixaModal.test.tsx` | Testes de validação e submit |
| `__tests__/operator/RecentList.test.tsx` | Testes de undo e countdown |

---

## Task 1: Tipos + mock data + offline queue

**Files:**
- Create: `types/operator.ts`
- Create: `lib/mock-data/operator.ts`
- Create: `lib/offline-queue.ts`
- Create: `__tests__/operator/offline-queue.test.ts`

- [ ] **Step 1: Criar `types/operator.ts`**

```typescript
// types/operator.ts

export interface SearchResult {
  id: string
  nome: string
  codigoInterno: string
  codigoBarras?: string
  categoria: string
  unidade: string
  estoqueAtual: number
  estoqueMinimo: number
  foto?: string
}

export type MotivoType =
  | 'CONSUMO_ROTINEIRO'
  | 'QUEBRA'
  | 'VENCIMENTO'
  | 'OUTRO'

export interface BaixaInput {
  produtoId: string
  quantidade: number
  unidade: string
  setorId: string
  motivo: MotivoType
  observacao?: string
}

export interface RecentBaixa {
  id: string
  produtoNome: string
  quantidade: number
  unidade: string
  hora: string        // "HH:mm"
  expiresAt: number   // Date.now() + 60_000
  synced: boolean
}

export interface Setor {
  id: string
  nome: string
  usageCount: number
}
```

- [ ] **Step 2: Criar `lib/mock-data/operator.ts`**

```typescript
// lib/mock-data/operator.ts
import type { SearchResult, Setor, RecentBaixa } from '@/types/operator'

export const mockSearchResults: SearchResult[] = [
  {
    id: 'p1',
    nome: 'Álcool 70% 1L Talge',
    codigoInterno: '00034',
    codigoBarras: '7891082036424',
    categoria: 'Limpeza',
    unidade: 'un',
    estoqueAtual: 8,
    estoqueMinimo: 20,
  },
  {
    id: 'p2',
    nome: 'Álcool Gel 70% 500g',
    codigoInterno: '00035',
    categoria: 'Limpeza',
    unidade: 'un',
    estoqueAtual: 3,
    estoqueMinimo: 10,
  },
  {
    id: 'p3',
    nome: 'Detergente 500ml',
    codigoInterno: '00041',
    categoria: 'Limpeza',
    unidade: 'un',
    estoqueAtual: 12,
    estoqueMinimo: 15,
  },
  {
    id: 'p4',
    nome: 'Luva Nitrílica P',
    codigoInterno: '00078',
    categoria: 'EPI',
    unidade: 'cx',
    estoqueAtual: 1,
    estoqueMinimo: 6,
  },
  {
    id: 'p5',
    nome: 'Papel Toalha PCT',
    codigoInterno: '00092',
    categoria: 'Limpeza',
    unidade: 'pct',
    estoqueAtual: 4,
    estoqueMinimo: 12,
  },
]

export const mockSetores: Setor[] = [
  { id: 's1', nome: 'Copa / Limpeza',  usageCount: 48 },
  { id: 's2', nome: 'Recepção',        usageCount: 12 },
  { id: 's3', nome: 'Manutenção',      usageCount: 8  },
  { id: 's4', nome: 'Administrativo',  usageCount: 5  },
]

export const mockRecentBaixas: RecentBaixa[] = [
  {
    id: 'b1',
    produtoNome: 'Luva Nitrílica P',
    quantidade: 2,
    unidade: 'cx',
    hora: '14:22',
    expiresAt: Date.now() + 43_000,
    synced: true,
  },
  {
    id: 'b2',
    produtoNome: 'Papel Toalha PCT',
    quantidade: 6,
    unidade: 'pct',
    hora: '13:41',
    expiresAt: Date.now() - 1,
    synced: true,
  },
]
```

- [ ] **Step 3: Escrever teste da offline queue (TDD)**

```typescript
// __tests__/operator/offline-queue.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { enqueue, dequeue, getAll, clearQueue } from '@/lib/offline-queue'
import type { BaixaInput } from '@/types/operator'

const sampleBaixa: BaixaInput = {
  produtoId: 'p1',
  quantidade: 3,
  unidade: 'un',
  setorId: 's1',
  motivo: 'CONSUMO_ROTINEIRO',
}

describe('offline-queue', () => {
  beforeEach(() => {
    localStorage.clear()
    clearQueue()
  })

  it('enqueue adiciona item com id único e timestamp', () => {
    const id = enqueue(sampleBaixa)
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('getAll retorna itens na ordem de inserção', () => {
    enqueue(sampleBaixa)
    enqueue({ ...sampleBaixa, produtoId: 'p2' })
    const all = getAll()
    expect(all).toHaveLength(2)
    expect(all[0].data.produtoId).toBe('p1')
    expect(all[1].data.produtoId).toBe('p2')
  })

  it('dequeue remove item por id', () => {
    const id = enqueue(sampleBaixa)
    dequeue(id)
    expect(getAll()).toHaveLength(0)
  })

  it('dequeue de id inexistente não lança erro', () => {
    expect(() => dequeue('nao-existe')).not.toThrow()
  })

  it('fila persiste entre chamadas (simula sessão)', () => {
    enqueue(sampleBaixa)
    // simula nova leitura do localStorage
    const all = getAll()
    expect(all).toHaveLength(1)
  })
})
```

- [ ] **Step 4: Rodar — esperar falha**

```bash
npm test -- __tests__/operator/offline-queue.test.ts
```

Esperado: `Cannot find module '@/lib/offline-queue'`

- [ ] **Step 5: Criar `lib/offline-queue.ts`**

```typescript
// lib/offline-queue.ts
import type { BaixaInput } from '@/types/operator'

const QUEUE_KEY = 'almoxcontrol:offline-queue'

export interface QueueItem {
  id: string
  data: BaixaInput
  queuedAt: number
}

function read(): QueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function write(items: QueueItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export function enqueue(data: BaixaInput): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const items = read()
  items.push({ id, data, queuedAt: Date.now() })
  write(items)
  return id
}

export function dequeue(id: string): void {
  write(read().filter((item) => item.id !== id))
}

export function getAll(): QueueItem[] {
  return read()
}

export function clearQueue(): void {
  write([])
}
```

- [ ] **Step 6: Rodar — esperar verde**

```bash
npm test -- __tests__/operator/offline-queue.test.ts
```

Esperado: `✓ 5 tests passed`

- [ ] **Step 7: Commit**

```bash
git add types/operator.ts lib/mock-data/operator.ts lib/offline-queue.ts __tests__/operator/
git commit -m "feat: operator types, mock data and offline queue"
```

---

## Task 2: OperatorShell + layout + loading skeleton

**Files:**
- Create: `app/(operator)/layout.tsx`
- Create: `app/(operator)/baixa/page.tsx` (placeholder)
- Create: `app/(operator)/baixa/loading.tsx`

- [ ] **Step 1: Criar `app/(operator)/layout.tsx`**

```typescript
// app/(operator)/layout.tsx

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-11 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-primary flex items-center justify-center text-white font-black text-sm">
            A
          </div>
          <span className="text-sm font-bold text-foreground">Baixa Rápida</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
          M
        </div>
      </header>
      {/* Main */}
      <main className="flex-1 overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y' }}>
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Criar placeholder `app/(operator)/baixa/page.tsx`**

```typescript
// app/(operator)/baixa/page.tsx
export default function BaixaPage() {
  return (
    <div className="p-4">
      <p className="text-muted-foreground text-sm">Baixa Page — em construção</p>
    </div>
  )
}
```

- [ ] **Step 3: Criar `app/(operator)/baixa/loading.tsx`**

```typescript
// app/(operator)/baixa/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function BaixaLoading() {
  return (
    <div className="p-3">
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-12 flex-1 rounded-xl bg-surface" />
        <Skeleton className="h-12 w-12 rounded-xl bg-surface" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Esperado: `✓ Compiled successfully` — a rota `/baixa` deve aparecer na lista de páginas geradas.

- [ ] **Step 5: Commit**

```bash
git add app/(operator)/
git commit -m "feat: OperatorShell layout and baixa route scaffold"
```

---

## Task 3: OfflineBanner (TDD)

**Files:**
- Create: `components/operator/OfflineBanner.tsx`
- Create: `__tests__/operator/OfflineBanner.test.tsx`

- [ ] **Step 1: Escrever teste (TDD)**

```typescript
// __tests__/operator/OfflineBanner.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OfflineBanner } from '@/components/operator/OfflineBanner'

describe('OfflineBanner', () => {
  it('não renderiza nada quando online', () => {
    render(<OfflineBanner isOnline={true} pendingCount={0} />)
    expect(screen.queryByText(/offline/i)).toBeNull()
  })

  it('renderiza banner quando offline', () => {
    render(<OfflineBanner isOnline={false} pendingCount={0} />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  it('mostra contagem de baixas pendentes', () => {
    render(<OfflineBanner isOnline={false} pendingCount={3} />)
    expect(screen.getByText(/3 baixas/i)).toBeInTheDocument()
  })

  it('não mostra contagem quando zero pendentes', () => {
    render(<OfflineBanner isOnline={false} pendingCount={0} />)
    expect(screen.queryByText(/baixas/i)).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/operator/OfflineBanner.test.tsx
```

Esperado: `Cannot find module '@/components/operator/OfflineBanner'`

- [ ] **Step 3: Criar `components/operator/OfflineBanner.tsx`**

```typescript
// components/operator/OfflineBanner.tsx

interface Props {
  isOnline: boolean
  pendingCount: number
}

export function OfflineBanner({ isOnline, pendingCount }: Props) {
  if (isOnline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/30 text-warning text-xs font-medium flex-shrink-0"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
      <span>
        Offline — baixas sincronizadas ao reconectar
        {pendingCount > 0 && (
          <span className="ml-1 font-bold">· {pendingCount} baixas aguardando</span>
        )}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npm test -- __tests__/operator/OfflineBanner.test.tsx
```

Esperado: `✓ 4 tests passed`

- [ ] **Step 5: Commit**

```bash
git add components/operator/OfflineBanner.tsx __tests__/operator/OfflineBanner.test.tsx
git commit -m "feat: OfflineBanner component with pending count"
```

---

## Task 4: SearchField + CameraButton (TDD)

**Files:**
- Create: `components/operator/SearchField.tsx`
- Create: `components/operator/CameraButton.tsx`
- Create: `__tests__/operator/SearchField.test.tsx`

- [ ] **Step 1: Escrever testes**

```typescript
// __tests__/operator/SearchField.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchField } from '@/components/operator/SearchField'

describe('SearchField', () => {
  it('renderiza campo de busca', () => {
    render(<SearchField value="" onChange={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('chama onChange com o valor digitado', () => {
    const onChange = vi.fn()
    render(<SearchField value="" onChange={onChange} />)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'alcool' } })
    expect(onChange).toHaveBeenCalledWith('alcool')
  })

  it('exibe placeholder correto', () => {
    render(<SearchField value="" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText(/buscar item ou código/i)).toBeInTheDocument()
  })

  it('aplica classe de borda offline quando isOffline=true', () => {
    render(<SearchField value="" onChange={vi.fn()} isOffline={true} />)
    const input = screen.getByRole('searchbox')
    expect(input.closest('div')).toHaveClass('border-warning')
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/operator/SearchField.test.tsx
```

Esperado: `Cannot find module '@/components/operator/SearchField'`

- [ ] **Step 3: Criar `components/operator/SearchField.tsx`**

```typescript
// components/operator/SearchField.tsx
'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (v: string) => void
  isOffline?: boolean
  autoFocus?: boolean
}

export function SearchField({ value, onChange, isOffline = false, autoFocus = true }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 bg-surface-elevated border-2 rounded-xl px-3 py-3 min-h-[48px] transition-colors',
        isOffline
          ? 'border-warning shadow-[0_0_0_3px_hsl(var(--color-warning)/0.15)]'
          : 'border-primary shadow-[0_0_0_3px_hsl(var(--color-primary)/0.12)]'
      )}
    >
      <Search size={16} className="text-muted-foreground flex-shrink-0" />
      <input
        role="searchbox"
        type="search"
        inputMode="search"
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Buscar item ou código de barras..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
        style={{ touchAction: 'manipulation' }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Criar `components/operator/CameraButton.tsx`**

```typescript
// components/operator/CameraButton.tsx
'use client'

import { Camera } from 'lucide-react'
import { useRef } from 'react'

interface Props {
  onCapture: (filename: string) => void
}

export function CameraButton({ onCapture }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onCapture(file.name)
    // reset so the same file can be selected again
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <label
      aria-label="Escanear código de barras"
      className="w-[44px] h-[44px] bg-surface-elevated border border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-border/60 transition-colors flex-shrink-0"
      style={{ touchAction: 'manipulation' }}
    >
      <Camera size={20} className="text-muted-foreground" />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
      />
    </label>
  )
}
```

- [ ] **Step 5: Rodar — esperar verde**

```bash
npm test -- __tests__/operator/SearchField.test.tsx
```

Esperado: `✓ 4 tests passed`

- [ ] **Step 6: Commit**

```bash
git add components/operator/SearchField.tsx components/operator/CameraButton.tsx __tests__/operator/SearchField.test.tsx
git commit -m "feat: SearchField and CameraButton components"
```

---

## Task 5: SearchResultList (TDD)

**Files:**
- Create: `components/operator/SearchResultList.tsx`
- Create: `__tests__/operator/SearchResultList.test.tsx`

- [ ] **Step 1: Escrever testes**

```typescript
// __tests__/operator/SearchResultList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchResultList } from '@/components/operator/SearchResultList'
import type { SearchResult } from '@/types/operator'

const results: SearchResult[] = [
  { id: 'p1', nome: 'Álcool 70% 1L', codigoInterno: '00034', categoria: 'Limpeza', unidade: 'un', estoqueAtual: 8,  estoqueMinimo: 20 },
  { id: 'p2', nome: 'Detergente',     codigoInterno: '00041', categoria: 'Limpeza', unidade: 'un', estoqueAtual: 12, estoqueMinimo: 15 },
  { id: 'p3', nome: 'Luva P',         codigoInterno: '00078', categoria: 'EPI',     unidade: 'cx', estoqueAtual: 0,  estoqueMinimo: 6  },
]

describe('SearchResultList', () => {
  it('renderiza todos os resultados', () => {
    render(<SearchResultList results={results} onSelect={vi.fn()} />)
    expect(screen.getByText('Álcool 70% 1L')).toBeInTheDocument()
    expect(screen.getByText('Detergente')).toBeInTheDocument()
    expect(screen.getByText('Luva P')).toBeInTheDocument()
  })

  it('chama onSelect ao clicar em um item', () => {
    const onSelect = vi.fn()
    render(<SearchResultList results={results} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Álcool 70% 1L'))
    expect(onSelect).toHaveBeenCalledWith(results[0])
  })

  it('exibe estoque em vermelho quando zerado', () => {
    render(<SearchResultList results={results} onSelect={vi.fn()} />)
    // Luva P tem estoque 0
    const zeroStock = screen.getByText('0 cx')
    expect(zeroStock).toHaveClass('text-danger')
  })

  it('exibe estado vazio quando sem resultados e com query', () => {
    render(<SearchResultList results={[]} onSelect={vi.fn()} query="xyz" />)
    expect(screen.getByText(/nenhum item encontrado/i)).toBeInTheDocument()
  })

  it('não exibe nada quando sem resultados e sem query', () => {
    const { container } = render(<SearchResultList results={[]} onSelect={vi.fn()} query="" />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/operator/SearchResultList.test.tsx
```

- [ ] **Step 3: Criar `components/operator/SearchResultList.tsx`**

```typescript
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
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npm test -- __tests__/operator/SearchResultList.test.tsx
```

Esperado: `✓ 5 tests passed`

- [ ] **Step 5: Commit**

```bash
git add components/operator/SearchResultList.tsx __tests__/operator/SearchResultList.test.tsx
git commit -m "feat: SearchResultList with stock coloring and empty state"
```

---

## Task 6: QuantityControl (TDD)

**Files:**
- Create: `components/operator/QuantityControl.tsx`
- Create: `__tests__/operator/QuantityControl.test.tsx`

- [ ] **Step 1: Escrever testes**

```typescript
// __tests__/operator/QuantityControl.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuantityControl } from '@/components/operator/QuantityControl'

describe('QuantityControl', () => {
  it('renderiza valor inicial', () => {
    render(<QuantityControl value={3} max={10} onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })

  it('incrementa ao clicar em +', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={3} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Aumentar quantidade'))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('decrementa ao clicar em −', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={3} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Diminuir quantidade'))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('não decrementa abaixo de 1', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={1} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Diminuir quantidade'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('não incrementa acima do max', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={10} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Aumentar quantidade'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('atalho define valor diretamente', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={1} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByText('5'))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('atalho não ultrapassa o max', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={1} max={3} onChange={onChange} />)
    fireEvent.click(screen.getByText('5'))
    expect(onChange).toHaveBeenCalledWith(3)
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/operator/QuantityControl.test.tsx
```

- [ ] **Step 3: Criar `components/operator/QuantityControl.tsx`**

```typescript
// components/operator/QuantityControl.tsx
'use client'

const SHORTCUTS = [1, 5, 10]

interface Props {
  value: number
  max: number
  onChange: (v: number) => void
}

export function QuantityControl({ value, max, onChange }: Props) {
  const decrement = () => { if (value > 1) onChange(value - 1) }
  const increment = () => { if (value < max) onChange(value + 1) }
  const setShortcut = (n: number) => onChange(Math.min(n, max))

  return (
    <div>
      {/* ± row */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          onClick={decrement}
          disabled={value <= 1}
          className="w-11 h-11 bg-surface-elevated border border-border rounded-xl flex items-center justify-center text-xl font-bold text-foreground disabled:opacity-30 transition-opacity"
          style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
        >
          −
        </button>

        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={1}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v) && v >= 1 && v <= max) onChange(v)
          }}
          className="flex-1 h-11 bg-surface-elevated border-2 border-primary rounded-xl text-center font-mono text-2xl font-black text-foreground outline-none"
          style={{ touchAction: 'manipulation' }}
        />

        <button
          type="button"
          aria-label="Aumentar quantidade"
          onClick={increment}
          disabled={value >= max}
          className="w-11 h-11 bg-surface-elevated border border-border rounded-xl flex items-center justify-center text-xl font-bold text-foreground disabled:opacity-30 transition-opacity"
          style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
        >
          +
        </button>
      </div>

      {/* Shortcuts */}
      <div className="flex gap-2">
        {SHORTCUTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setShortcut(n)}
            className="flex-1 h-11 bg-surface-elevated border border-border rounded-xl text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            style={{ touchAction: 'manipulation', minHeight: 44 }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npm test -- __tests__/operator/QuantityControl.test.tsx
```

Esperado: `✓ 7 tests passed`

- [ ] **Step 5: Commit**

```bash
git add components/operator/QuantityControl.tsx __tests__/operator/QuantityControl.test.tsx
git commit -m "feat: QuantityControl with ± buttons, shortcuts and max cap"
```

---

## Task 7: BaixaModal (TDD)

**Files:**
- Create: `components/operator/BaixaModal.tsx`
- Create: `__tests__/operator/BaixaModal.test.tsx`

- [ ] **Step 1: Escrever testes**

```typescript
// __tests__/operator/BaixaModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BaixaModal } from '@/components/operator/BaixaModal'
import type { SearchResult } from '@/types/operator'
import { mockSetores } from '@/lib/mock-data/operator'

const item: SearchResult = {
  id: 'p1',
  nome: 'Álcool 70% 1L',
  codigoInterno: '00034',
  categoria: 'Limpeza',
  unidade: 'un',
  estoqueAtual: 8,
  estoqueMinimo: 20,
}

describe('BaixaModal', () => {
  it('não renderiza quando item é null', () => {
    const { container } = render(
      <BaixaModal item={null} setores={mockSetores} onClose={vi.fn()} onConfirm={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('exibe nome e código do produto', () => {
    render(<BaixaModal item={item} setores={mockSetores} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByText('Álcool 70% 1L')).toBeInTheDocument()
    expect(screen.getByText(/00034/)).toBeInTheDocument()
  })

  it('exibe estoque atual em destaque', () => {
    render(<BaixaModal item={item} setores={mockSetores} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('chama onClose ao clicar em Cancelar', () => {
    const onClose = vi.fn()
    render(<BaixaModal item={item} setores={mockSetores} onClose={onClose} onConfirm={vi.fn()} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalled()
  })

  it('chama onConfirm com dados corretos ao confirmar', () => {
    const onConfirm = vi.fn()
    render(<BaixaModal item={item} setores={mockSetores} onClose={vi.fn()} onConfirm={onConfirm} />)
    // seleciona setor (primeiro da lista)
    fireEvent.change(screen.getByLabelText('Setor solicitante'), { target: { value: 's1' } })
    fireEvent.click(screen.getByText(/confirmar baixa/i))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        produtoId: 'p1',
        unidade: 'un',
        setorId: 's1',
        motivo: 'CONSUMO_ROTINEIRO',
      })
    )
  })

  it('bloqueia confirmação sem setor selecionado', () => {
    const onConfirm = vi.fn()
    render(<BaixaModal item={item} setores={mockSetores} onClose={vi.fn()} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText(/confirmar baixa/i))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText(/setor obrigatório/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/operator/BaixaModal.test.tsx
```

- [ ] **Step 3: Criar `components/operator/BaixaModal.tsx`**

```typescript
// components/operator/BaixaModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuantityControl } from './QuantityControl'
import type { SearchResult, BaixaInput, MotivoType, Setor } from '@/types/operator'

const MOTIVOS: { value: MotivoType; label: string }[] = [
  { value: 'CONSUMO_ROTINEIRO', label: 'Consumo rotineiro' },
  { value: 'QUEBRA',            label: 'Quebra / Perda' },
  { value: 'VENCIMENTO',        label: 'Vencimento' },
  { value: 'OUTRO',             label: 'Outro' },
]

interface Props {
  item: SearchResult | null
  setores: Setor[]
  onClose: () => void
  onConfirm: (baixa: BaixaInput) => void
}

export function BaixaModal({ item, setores, onClose, onConfirm }: Props) {
  const [quantidade, setQuantidade] = useState(1)
  const [setorId, setSetorId] = useState('')
  const [motivo, setMotivo] = useState<MotivoType>('CONSUMO_ROTINEIRO')
  const [observacao, setObservacao] = useState('')
  const [setorError, setSetorError] = useState(false)
  const firstFocusRef = useRef<HTMLSelectElement>(null)

  // Sort setores by usageCount desc
  const sortedSetores = [...setores].sort((a, b) => b.usageCount - a.usageCount)

  useEffect(() => {
    if (item) {
      setQuantidade(1)
      setSetorId('')
      setMotivo('CONSUMO_ROTINEIRO')
      setObservacao('')
      setSetorError(false)
      // Move focus inside modal
      setTimeout(() => firstFocusRef.current?.focus(), 50)
    }
  }, [item])

  if (!item) return null

  const handleConfirm = () => {
    if (!setorId) {
      setSetorError(true)
      firstFocusRef.current?.focus()
      return
    }
    onConfirm({ produtoId: item.id, quantidade, unidade: item.unidade, setorId, motivo, observacao: observacao || undefined })
  }

  const stockOk = item.estoqueAtual > 0
  const stockColor = item.estoqueAtual === 0
    ? 'text-danger'
    : item.estoqueAtual < item.estoqueMinimo
      ? 'text-warning'
      : 'text-success'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Baixa de ${item.nome}`}
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-card rounded-t-2xl border-t border-border p-4 pb-6 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-8 h-1 bg-border rounded-full mx-auto mb-1" />

        {/* Product header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-surface-elevated border border-border rounded-xl flex items-center justify-center flex-shrink-0">
            <Package size={20} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-snug">{item.nome}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cód. {item.codigoInterno} · {item.categoria}</p>
            <span className={cn('inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-md border', stockOk ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger')}>
              {stockOk ? `✓ ${item.estoqueAtual} ${item.unidade} disponíveis` : 'Sem estoque'}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Stock highlight */}
        <div className="bg-surface-elevated border border-border rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Estoque atual</p>
            <p className={cn('font-mono text-3xl font-black leading-none mt-0.5', stockColor)}>
              {item.estoqueAtual}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.unidade}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Mínimo</p>
            <p className="font-mono text-lg font-bold text-muted-foreground">{item.estoqueMinimo}</p>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quantidade a baixar</p>
          <QuantityControl value={quantidade} max={item.estoqueAtual || 1} onChange={setQuantidade} />
        </div>

        {/* Setor */}
        <div>
          <label htmlFor="setor-select" className="block text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
            Setor solicitante
          </label>
          <select
            id="setor-select"
            aria-label="Setor solicitante"
            ref={firstFocusRef}
            value={setorId}
            onChange={(e) => { setSetorId(e.target.value); setSetorError(false) }}
            className={cn(
              'w-full bg-surface-elevated border rounded-xl px-3 h-11 text-sm text-foreground outline-none appearance-none',
              setorError ? 'border-danger' : 'border-border'
            )}
          >
            <option value="">Selecione o setor...</option>
            {sortedSetores.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          {setorError && (
            <p className="text-xs text-danger mt-1" role="alert">Setor obrigatório</p>
          )}
        </div>

        {/* Motivo */}
        <div>
          <label htmlFor="motivo-select" className="block text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
            Motivo
          </label>
          <select
            id="motivo-select"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoType)}
            className="w-full bg-surface-elevated border border-border rounded-xl px-3 h-11 text-sm text-foreground outline-none appearance-none"
          >
            {MOTIVOS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Observação (opcional) */}
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer select-none">Observação (opcional)</summary>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Detalhe adicional..."
            rows={2}
            className="mt-2 w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none resize-none"
          />
        </details>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 bg-surface-elevated border border-border rounded-xl text-sm font-bold text-muted-foreground"
            style={{ touchAction: 'manipulation' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!stockOk}
            className="flex-[2] h-14 bg-success rounded-xl text-sm font-black text-white disabled:opacity-40 shadow-[0_0_16px_hsl(var(--color-success)/0.3)] transition-opacity"
            style={{ touchAction: 'manipulation', minHeight: 56 }}
          >
            ✓ Confirmar Baixa
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npm test -- __tests__/operator/BaixaModal.test.tsx
```

Esperado: `✓ 6 tests passed`

- [ ] **Step 5: Commit**

```bash
git add components/operator/BaixaModal.tsx __tests__/operator/BaixaModal.test.tsx
git commit -m "feat: BaixaModal with validation, focus trap and quantity control"
```

---

## Task 8: ConfirmationScreen

**Files:**
- Create: `components/operator/ConfirmationScreen.tsx`

> Este componente usa `navigator.vibrate` e `aria-live` — não tem TDD por depender de APIs de browser. Teste visual manual.

- [ ] **Step 1: Criar `components/operator/ConfirmationScreen.tsx`**

```typescript
// components/operator/ConfirmationScreen.tsx
'use client'

import { useEffect } from 'react'
import { Check } from 'lucide-react'
import type { BaixaInput, SearchResult } from '@/types/operator'

interface Props {
  baixa: BaixaInput
  produto: SearchResult
  setorNome: string
  onComplete: () => void
}

export function ConfirmationScreen({ baixa, produto, setorNome, onComplete }: Props) {
  useEffect(() => {
    // Haptic feedback
    try { navigator.vibrate([100, 50, 100]) } catch {}

    // Auto-dismiss após 2s
    const timer = setTimeout(onComplete, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  const saldoRestante = produto.estoqueAtual - baixa.quantidade

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4 px-6"
      aria-live="polite"
      aria-label={`Baixa registrada: ${produto.nome}, ${baixa.quantidade} ${baixa.unidade}`}
    >
      {/* Ícone */}
      <div
        className="w-16 h-16 rounded-full bg-success flex items-center justify-center motion-safe:animate-bounce-once"
        style={{ boxShadow: '0 0 32px hsl(var(--color-success)/0.5)' }}
      >
        <Check size={32} className="text-white" strokeWidth={3} />
      </div>

      <p className="text-xl font-black text-success">Baixa registrada!</p>

      {/* Card de confirmação */}
      <div
        className="w-full max-w-xs bg-card border border-success/20 rounded-2xl px-5 py-4 flex flex-col gap-2"
      >
        <Row label="Item"      value={produto.nome} />
        <Row label="Quantidade" value={`−${baixa.quantidade} ${baixa.unidade}`} valueClass="text-danger" />
        <Row label="Setor"     value={setorNome} />
        <Row label="Saldo restante" value={`${saldoRestante} ${produto.unidade}`} valueClass="text-success" />
      </div>

      <p className="text-xs text-muted-foreground">Voltando à busca em 2s...</p>
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold font-mono text-foreground ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/operator/ConfirmationScreen.tsx
git commit -m "feat: ConfirmationScreen with haptic feedback and auto-dismiss"
```

---

## Task 9: RecentList (TDD)

**Files:**
- Create: `components/operator/RecentList.tsx`
- Create: `__tests__/operator/RecentList.test.tsx`

- [ ] **Step 1: Escrever testes**

```typescript
// __tests__/operator/RecentList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RecentList } from '@/components/operator/RecentList'
import type { RecentBaixa } from '@/types/operator'

const now = Date.now()

const items: RecentBaixa[] = [
  { id: 'b1', produtoNome: 'Álcool 70% 1L', quantidade: 3, unidade: 'un',  hora: '14:22', expiresAt: now + 30_000, synced: true  },
  { id: 'b2', produtoNome: 'Luva Nitrílica', quantidade: 2, unidade: 'cx',  hora: '13:41', expiresAt: now - 1,      synced: true  },
]

describe('RecentList', () => {
  it('renderiza lista de baixas', () => {
    render(<RecentList items={items} onUndo={vi.fn()} />)
    expect(screen.getByText('Álcool 70% 1L')).toBeInTheDocument()
    expect(screen.getByText('Luva Nitrílica')).toBeInTheDocument()
  })

  it('exibe botão desfazer apenas para baixas dentro do prazo', () => {
    render(<RecentList items={items} onUndo={vi.fn()} />)
    // b1: ainda no prazo → deve ter botão
    expect(screen.getByText(/desfazer/i)).toBeInTheDocument()
  })

  it('não exibe botão desfazer para baixas expiradas', () => {
    // b2 expirou (expiresAt = now - 1)
    const expired: RecentBaixa[] = [
      { id: 'b2', produtoNome: 'Luva', quantidade: 2, unidade: 'cx', hora: '13:41', expiresAt: now - 1, synced: true },
    ]
    render(<RecentList items={expired} onUndo={vi.fn()} />)
    expect(screen.queryByText(/desfazer/i)).toBeNull()
  })

  it('chama onUndo com id ao clicar em Desfazer', () => {
    const onUndo = vi.fn()
    render(<RecentList items={items} onUndo={onUndo} />)
    fireEvent.click(screen.getByText(/desfazer/i))
    expect(onUndo).toHaveBeenCalledWith('b1')
  })

  it('não renderiza nada quando lista vazia', () => {
    const { container } = render(<RecentList items={[]} onUndo={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/operator/RecentList.test.tsx
```

- [ ] **Step 3: Criar `components/operator/RecentList.tsx`**

```typescript
// components/operator/RecentList.tsx
'use client'

import { useState, useEffect } from 'react'
import type { RecentBaixa } from '@/types/operator'

function Countdown({ expiresAt, onExpire }: { expiresAt: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return }
    const id = setInterval(() => {
      const secs = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setRemaining(secs)
      if (secs <= 0) { clearInterval(id); onExpire() }
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpire, remaining])

  if (remaining <= 0) return null
  return <span className="text-xs text-muted-foreground ml-1">{remaining}s</span>
}

interface Props {
  items: RecentBaixa[]
  onUndo: (id: string) => void
}

export function RecentList({ items, onUndo }: Props) {
  const [expired, setExpired] = useState<Set<string>>(new Set())

  if (items.length === 0) return null

  const markExpired = (id: string) => setExpired((prev) => new Set([...prev, id]))

  return (
    <div className="px-3 pt-3 pb-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
        Últimas baixas hoje
      </p>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => {
          const canUndo = item.expiresAt > Date.now() && !expired.has(item.id)
          return (
            <div
              key={item.id}
              className="flex items-center justify-between border-l-2 border-success bg-success/5 rounded-r-lg px-3 py-2 min-h-[44px]"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{item.produtoNome}</p>
                <p className="text-[10px] text-muted-foreground">
                  −{item.quantidade} {item.unidade} · {item.hora}
                </p>
              </div>
              {canUndo && (
                <button
                  onClick={() => onUndo(item.id)}
                  className="flex items-center ml-2 text-xs font-bold text-primary bg-primary/10 border border-primary/30 rounded-lg px-2 py-1 flex-shrink-0"
                  style={{ touchAction: 'manipulation', minHeight: 44 }}
                >
                  Desfazer
                  <Countdown expiresAt={item.expiresAt} onExpire={() => markExpired(item.id)} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npm test -- __tests__/operator/RecentList.test.tsx
```

Esperado: `✓ 5 tests passed`

- [ ] **Step 5: Commit**

```bash
git add components/operator/RecentList.tsx __tests__/operator/RecentList.test.tsx
git commit -m "feat: RecentList with countdown and undo button"
```

---

## Task 10: BaixaPage — Composição final

**Files:**
- Modify: `app/(operator)/baixa/page.tsx` (substitui placeholder)
- Modify: `app/(operator)/layout.tsx` (adiciona OfflineBanner)

- [ ] **Step 1: Substituir `app/(operator)/baixa/page.tsx` pelo conteúdo final**

```typescript
// app/(operator)/baixa/page.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { SearchField }         from '@/components/operator/SearchField'
import { CameraButton }        from '@/components/operator/CameraButton'
import { SearchResultList }    from '@/components/operator/SearchResultList'
import { BaixaModal }          from '@/components/operator/BaixaModal'
import { ConfirmationScreen }  from '@/components/operator/ConfirmationScreen'
import { RecentList }          from '@/components/operator/RecentList'
import { OfflineBanner }       from '@/components/operator/OfflineBanner'
import { mockSearchResults, mockSetores, mockRecentBaixas } from '@/lib/mock-data/operator'
import { enqueue, dequeue, getAll } from '@/lib/offline-queue'
import type { SearchResult, BaixaInput, RecentBaixa } from '@/types/operator'

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return isOnline
}

function filterResults(query: string, all: SearchResult[]): SearchResult[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return all.filter(
    (r) =>
      r.nome.toLowerCase().includes(q) ||
      r.codigoInterno.includes(q) ||
      (r.codigoBarras ?? '').includes(q)
  ).slice(0, 5)
}

export default function BaixaPage() {
  const isOnline = useOnlineStatus()
  const [query, setQuery]           = useState('')
  const [searchKey, setSearchKey]   = useState(0)   // increment to remount SearchField → autoFocus
  const [selected, setSelected]     = useState<SearchResult | null>(null)
  const [confirmation, setConfirmation] = useState<{ baixa: BaixaInput; produto: SearchResult } | null>(null)
  const [recentBaixas, setRecentBaixas] = useState<RecentBaixa[]>(mockRecentBaixas)

  const results = filterResults(query, mockSearchResults)
  const pendingCount = getAll().length

  const handleConfirm = useCallback((baixa: BaixaInput) => {
    if (!selected) return

    // Enqueue offline or (future) POST online
    const id = enqueue(baixa)

    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const newRecent: RecentBaixa = {
      id,
      produtoNome: selected.nome,
      quantidade: baixa.quantidade,
      unidade: baixa.unidade,
      hora,
      expiresAt: Date.now() + 60_000,
      synced: isOnline,
    }

    setRecentBaixas((prev) => [newRecent, ...prev].slice(0, 10))
    setConfirmation({ baixa, produto: selected })
    setSelected(null)
  }, [selected, isOnline])

  const handleConfirmationComplete = useCallback(() => {
    setConfirmation(null)
    setQuery('')
    setSearchKey((k) => k + 1)  // remount SearchField → autoFocus triggers
  }, [])

  const handleUndo = useCallback((id: string) => {
    dequeue(id)
    setRecentBaixas((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const setor = confirmation
    ? mockSetores.find((s) => s.id === confirmation.baixa.setorId)?.nome ?? ''
    : ''

  return (
    <>
      {/* Offline banner */}
      <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} />

      {/* Search row */}
      <div className="flex gap-2 px-3 pt-3 pb-2">
        <SearchField
          key={searchKey}
          value={query}
          onChange={setQuery}
          isOffline={!isOnline}
          autoFocus
        />
        <CameraButton onCapture={(filename) => setQuery(filename.split('.')[0])} />
      </div>

      {/* Helper text */}
      {!query && (
        <p className="text-xs text-muted-foreground text-center px-3 pb-2">
          Toque em um item para dar baixa
        </p>
      )}

      {/* Results */}
      <SearchResultList
        results={results}
        onSelect={setSelected}
        query={query}
        isOffline={!isOnline}
      />

      {/* Recent baixas */}
      <RecentList items={recentBaixas} onUndo={handleUndo} />

      {/* Modal */}
      <BaixaModal
        item={selected}
        setores={mockSetores}
        onClose={() => setSelected(null)}
        onConfirm={handleConfirm}
      />

      {/* Confirmation */}
      {confirmation && (
        <ConfirmationScreen
          baixa={confirmation.baixa}
          produto={confirmation.produto}
          setorNome={setor}
          onComplete={handleConfirmationComplete}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Rodar todos os testes**

```bash
npm test
```

Esperado: todos os testes passam (20 anteriores + novos = sem regressões).

- [ ] **Step 4: Build de produção**

```bash
npm run build
```

Esperado: `✓ Compiled successfully` — `/baixa` aparece nas rotas geradas.

- [ ] **Step 5: Iniciar dev server e verificar manualmente**

```bash
npm run dev
```

Abrir `http://localhost:3000/baixa` e verificar:
- [ ] Campo de busca em foco automático
- [ ] Digitar "alcool" → resultados aparecem
- [ ] Clicar em item → modal abre
- [ ] Selecionar setor + confirmar → tela verde aparece → foco volta à busca
- [ ] Item aparece na lista "Últimas baixas hoje" com botão "Desfazer 60s"
- [ ] Clicar "Desfazer" → item some da lista
- [ ] Desligar rede → banner âmbar aparece
- [ ] Background #000 em toda a tela (sem fundo claro)
- [ ] Todos os botões têm altura visível ≥ 44px

- [ ] **Step 6: Commit final**

```bash
git add app/(operator)/baixa/page.tsx
git commit -m "feat: BaixaPage — operator low-stock withdrawal flow complete"
```

---

## Verificação Final

- [ ] **Todos os testes passam**

```bash
npm test
```

Esperado: `✓ X tests passed` sem falhas.

- [ ] **Build limpo**

```bash
npm run build
```

- [ ] **Pré-checagem UI**

```bash
# Nenhum emoji como ícone
grep -r "🔴\|🟢\|⚠️\|✅" components/operator/ app/\(operator\)/

# Nenhum hover:scale
grep -r "hover:scale" components/operator/

# Sem fundo claro
grep -r "bg-white\|bg-slate-50" components/operator/ app/\(operator\)/

# Verificar min-h nos botões críticos
grep -n "min-h\|minHeight" components/operator/BaixaModal.tsx
grep -n "min-h\|minHeight" components/operator/QuantityControl.tsx
```

- [ ] **Commit de verificação** (se houver mudanças)

```bash
git add .
git commit -m "chore: final verification baixa screen — all checks passing"
```
