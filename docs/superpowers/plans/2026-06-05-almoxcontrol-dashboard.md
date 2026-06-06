# AlmoxControl Dashboard Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o dashboard administrativo do AlmoxControl com KPIs, gráficos de consumo, alertas por severidade, itens críticos e tabela de movimentações em layout Bento Denso OLED dark.

**Architecture:** Next.js 14 App Router com RSC para o shell e Client Components para gráficos interativos (Recharts). Dados mockados em `lib/mock-data/dashboard.ts` com tipos compartilhados em `types/dashboard.ts`. Layout em dois níveis: `app/layout.tsx` (fonte/HTML) → `app/(dashboard)/layout.tsx` (SidebarProvider + shell) → `app/(dashboard)/page.tsx` (grid bento).

**Tech Stack:** Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui · Recharts · Lucide React · Fira Code (Google Fonts) · Vitest + @testing-library/react

---

## File Map

| Arquivo | Responsabilidade |
|---------|-----------------|
| `app/layout.tsx` | HTML root, Inter + Fira Code fonts |
| `app/globals.css` | CSS variables OLED dark, scrollbar custom |
| `tailwind.config.ts` | Extend theme com tokens do design system |
| `app/(dashboard)/layout.tsx` | SidebarProvider + AppSidebar + main wrapper |
| `app/(dashboard)/page.tsx` | Composição do grid bento (RSC) |
| `app/(dashboard)/loading.tsx` | Skeleton de loading da página |
| `types/dashboard.ts` | Interfaces KpiData, MovementRow, AlertItem, CriticalItem |
| `lib/format.ts` | Formatadores pt-BR: moeda, número, data, hora |
| `lib/mock-data/dashboard.ts` | Dados mockados tipados |
| `components/dashboard/AppSidebar.tsx` | Sidebar icon-only com nav + warehouse selector |
| `components/dashboard/DashboardHeader.tsx` | Topbar com título, WarehouseSelector, notificações |
| `components/dashboard/WarehouseSelector.tsx` | Select de almoxarifado com ponto online |
| `components/dashboard/KpiCard.tsx` | Card de KPI com valor, delta e ícone |
| `components/dashboard/DonutMini.tsx` | SVG donut mini de categorias para KPI row |
| `components/dashboard/MonthlyConsumptionChart.tsx` | Recharts BarChart consumo 6 meses |
| `components/dashboard/AlertList.tsx` | Lista de alertas por severidade |
| `components/dashboard/CriticalItemsList.tsx` | Itens críticos com progress bar |
| `components/dashboard/MovementsTable.tsx` | shadcn Table de últimas movimentações |
| `__tests__/lib/format.test.ts` | Testes dos formatadores pt-BR |
| `__tests__/components/KpiCard.test.tsx` | Testes de render do KpiCard |
| `__tests__/components/AlertList.test.tsx` | Testes de render e severidade da AlertList |
| `__tests__/components/MovementsTable.test.tsx` | Testes de render e badges da MovementsTable |

---

## Task 1: Scaffold Next.js + instalar dependências

**Files:**
- Create: `package.json` (gerado pelo create-next-app)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Criar projeto Next.js no diretório atual**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-git
```

Responda "No" para qualquer prompt de turbopack se perguntado.

- [ ] **Step 2: Instalar dependências de produto**

```bash
npm install recharts lucide-react
```

- [ ] **Step 3: Instalar shadcn/ui**

```bash
npx shadcn@latest init
```

Quando perguntado:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

- [ ] **Step 4: Adicionar componentes shadcn necessários**

```bash
npx shadcn@latest add sidebar table select badge popover separator skeleton
```

- [ ] **Step 5: Instalar dependências de teste**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 6: Criar `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 7: Criar `vitest.setup.ts`**

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Adicionar script de teste no `package.json`**

Abra `package.json` e adicione dentro de `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 9: Verificar que o projeto compila**

```bash
npm run build
```

Resultado esperado: `✓ Compiled successfully`

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 14 + shadcn/ui + Recharts + Vitest"
```

---

## Task 2: Configurar tema OLED dark + tipografia

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Substituir `app/globals.css` pelo tema OLED**

```css
/* app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 0%;
    --foreground: 214 32% 95%;
    --card: 216 28% 7%;
    --card-foreground: 214 32% 95%;
    --popover: 216 28% 7%;
    --popover-foreground: 214 32% 95%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 215 25% 11%;
    --secondary-foreground: 214 32% 95%;
    --muted: 215 25% 11%;
    --muted-foreground: 215 16% 47%;
    --accent: 38 92% 50%;
    --accent-foreground: 0 0% 0%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 215 28% 17%;
    --input: 215 28% 17%;
    --ring: 217 91% 60%;
    --radius: 0.625rem;
    /* tokens extras */
    --surface: 216 28% 7%;
    --surface-elevated: 216 24% 11%;
    --success: 142 71% 45%;
    --warning: 38 92% 50%;
    --danger: 0 72% 51%;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}

/* scrollbar fina OLED */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { @apply bg-border rounded-sm; }
```

- [ ] **Step 2: Atualizar `tailwind.config.ts`**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        'surface-elevated': 'hsl(var(--surface-elevated))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

- [ ] **Step 3: Atualizar `app/layout.tsx`**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AlmoxControl',
  description: 'Controle de almoxarifado inteligente',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Esperado: sem erros de CSS/TypeScript.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx tailwind.config.ts
git commit -m "style: OLED dark theme + Inter + Fira Code typography tokens"
```

---

## Task 3: Tipos + formatadores pt-BR + mock data

**Files:**
- Create: `types/dashboard.ts`
- Create: `lib/format.ts`
- Create: `lib/mock-data/dashboard.ts`
- Create: `__tests__/lib/format.test.ts`

- [ ] **Step 1: Escrever testes dos formatadores (TDD — falham primeiro)**

```typescript
// __tests__/lib/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber, formatDate, formatTime, formatDelta } from '@/lib/format'

describe('formatCurrency', () => {
  it('formata valor com R$, ponto de milhar e vírgula decimal', () => {
    expect(formatCurrency(42830)).toBe('R$ 42.830,00')
  })
  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
  it('formata valor com centavos', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
  })
})

describe('formatNumber', () => {
  it('formata número com ponto de milhar', () => {
    expect(formatNumber(1234)).toBe('1.234')
  })
  it('formata número simples', () => {
    expect(formatNumber(38)).toBe('38')
  })
})

describe('formatDate', () => {
  it('formata data em dd/mm/aaaa', () => {
    expect(formatDate(new Date('2026-06-05T12:00:00'))).toBe('05/06/2026')
  })
})

describe('formatTime', () => {
  it('formata hora em HH:mm', () => {
    expect(formatTime(new Date('2026-06-05T14:22:00'))).toBe('14:22')
  })
})

describe('formatDelta', () => {
  it('retorna string com seta para cima e cor green para positivo', () => {
    const result = formatDelta(12.4, 'up')
    expect(result.text).toBe('↑ +12,4%')
    expect(result.color).toBe('text-success')
  })
  it('retorna seta para baixo e cor danger para negativo', () => {
    const result = formatDelta(3, 'down')
    expect(result.text).toBe('↓ +3')
    expect(result.color).toBe('text-danger')
  })
  it('retorna traço e cor muted para neutro', () => {
    const result = formatDelta(0, 'neutral')
    expect(result.text).toBe('— mesmo nível')
    expect(result.color).toBe('text-muted-foreground')
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/lib/format.test.ts
```

Esperado: `Cannot find module '@/lib/format'`

- [ ] **Step 3: Criar `lib/format.ts`**

```typescript
// lib/format.ts

const ptBR = 'pt-BR'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(ptBR, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(ptBR).format(value)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(ptBR, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(ptBR, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

type DeltaDirection = 'up' | 'down' | 'neutral'

export function formatDelta(
  value: number,
  direction: DeltaDirection,
  suffix?: string
): { text: string; color: string } {
  if (direction === 'neutral') {
    return { text: '— mesmo nível', color: 'text-muted-foreground' }
  }
  const arrow = direction === 'up' ? '↑' : '↓'
  const formatted = value % 1 !== 0
    ? `+${value.toLocaleString(ptBR, { maximumFractionDigits: 1 })}%`
    : `+${value}`
  return {
    text: `${arrow} ${formatted}${suffix ? ` ${suffix}` : ''}`,
    color: direction === 'up' ? 'text-success' : 'text-danger',
  }
}
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npm test -- __tests__/lib/format.test.ts
```

Esperado: `✓ 9 tests passed`

- [ ] **Step 5: Criar `types/dashboard.ts`**

```typescript
// types/dashboard.ts

export type DeltaDirection = 'up' | 'down' | 'neutral'

export interface KpiDelta {
  value: number
  direction: DeltaDirection
  suffix?: string   // ex: "vs mês anterior", "este mês"
}

export interface KpiData {
  valorEstoque: number
  itensCadastrados: number
  itensAbaixoMinimo: number
  saidasHoje: number
  deltas: {
    valorEstoque: KpiDelta
    itensCadastrados: KpiDelta
    itensAbaixoMinimo: KpiDelta
    saidasHoje: KpiDelta
  }
}

export interface CategorySlice {
  nome: string
  percentual: number    // 0-100
  cor: string           // hex
}

export interface MonthlyData {
  mes: string           // ex: "Jan", "Fev"
  unidades: number
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA'

export interface MovementRow {
  id: string
  tipo: MovementType
  itemNome: string
  quantidade: number    // positivo = entrada, negativo = saída
  unidade: string       // "un", "gl", "pct", "cx", "fd"
  hora: string          // "HH:mm"
  usuario: string
}

export type AlertSeverity = 'CRITICO' | 'ALERTA' | 'INFO'

export interface AlertItem {
  id: string
  severidade: AlertSeverity
  mensagem: string
  meta: string          // "Estoque: 0 un · Mín: 20"
}

export interface CriticalItem {
  id: string
  nome: string
  estoqueAtual: number
  estoqueMinimo: number
  unidade: string
}

export interface Warehouse {
  id: string
  nome: string
  online: boolean
}
```

- [ ] **Step 6: Criar `lib/mock-data/dashboard.ts`**

```typescript
// lib/mock-data/dashboard.ts
import type {
  KpiData, CategorySlice, MonthlyData,
  MovementRow, AlertItem, CriticalItem, Warehouse,
} from '@/types/dashboard'

export const mockWarehouses: Warehouse[] = [
  { id: 'w1', nome: 'Almoxarifado Principal', online: true },
  { id: 'w2', nome: 'Almoxarifado Filial', online: false },
]

export const mockKpi: KpiData = {
  valorEstoque: 42830,
  itensCadastrados: 247,
  itensAbaixoMinimo: 14,
  saidasHoje: 38,
  deltas: {
    valorEstoque:      { value: 12.4, direction: 'up',     suffix: 'vs mês anterior' },
    itensCadastrados:  { value: 8,    direction: 'up',     suffix: 'este mês' },
    itensAbaixoMinimo: { value: 3,    direction: 'down',   suffix: 'vs semana passada' },
    saidasHoje:        { value: 0,    direction: 'neutral' },
  },
}

export const mockCategories: CategorySlice[] = [
  { nome: 'Limpeza',       percentual: 42, cor: '#3B82F6' },
  { nome: 'Copa',          percentual: 28, cor: '#22C55E' },
  { nome: 'EPI',           percentual: 18, cor: '#F59E0B' },
  { nome: 'Outros',        percentual: 12, cor: '#A855F7' },
]

export const mockMonthlyData: MonthlyData[] = [
  { mes: 'Jan', unidades: 312 },
  { mes: 'Fev', unidades: 289 },
  { mes: 'Mar', unidades: 401 },
  { mes: 'Abr', unidades: 378 },
  { mes: 'Mai', unidades: 455 },
  { mes: 'Jun', unidades: 512 },
]

export const mockAlerts: AlertItem[] = [
  { id: 'a1', severidade: 'CRITICO', mensagem: 'Álcool 70% zerado',                        meta: 'Estoque: 0 un · Mín: 20' },
  { id: 'a2', severidade: 'CRITICO', mensagem: 'Luva Nitrílica P — ruptura em 2 dias',      meta: 'Estoque: 1 cx · Consumo: 0,5/dia' },
  { id: 'a3', severidade: 'CRITICO', mensagem: 'Água Sanitária 5L abaixo do mínimo',        meta: 'Estoque: 2 gl · Mín: 8' },
  { id: 'a4', severidade: 'ALERTA',  mensagem: 'Detergente 500ml — reposição sugerida',     meta: 'Estoque: 12 un · Ponto: 15' },
  { id: 'a5', severidade: 'ALERTA',  mensagem: 'Café 500g — validade em 8 dias',            meta: 'Lote 2024-06B · Qtd: 4 pct' },
  { id: 'a6', severidade: 'INFO',    mensagem: 'Inventário vence em 5 dias',                meta: 'Ciclo mensal · Junho/2026' },
]

export const mockCriticalItems: CriticalItem[] = [
  { id: 'c1', nome: 'Álcool 70% 1L',    estoqueAtual: 0,  estoqueMinimo: 20, unidade: 'un'  },
  { id: 'c2', nome: 'Luva Nitrílica P', estoqueAtual: 1,  estoqueMinimo: 6,  unidade: 'cx'  },
  { id: 'c3', nome: 'Água Sanitária 5L',estoqueAtual: 2,  estoqueMinimo: 8,  unidade: 'gl'  },
  { id: 'c4', nome: 'Papel Toalha PCT', estoqueAtual: 4,  estoqueMinimo: 12, unidade: 'pct' },
  { id: 'c5', nome: 'Detergente 500ml', estoqueAtual: 12, estoqueMinimo: 15, unidade: 'un'  },
]

export const mockMovements: MovementRow[] = [
  { id: 'm1', tipo: 'SAIDA',    itemNome: 'Álcool 70% 1L',      quantidade: -4,  unidade: 'un',  hora: '14:22', usuario: 'Michel' },
  { id: 'm2', tipo: 'ENTRADA',  itemNome: 'Detergente 500ml',   quantidade: +24, unidade: 'un',  hora: '13:58', usuario: 'Ana'    },
  { id: 'm3', tipo: 'SAIDA',    itemNome: 'Papel Toalha PCT',   quantidade: -6,  unidade: 'pct', hora: '13:41', usuario: 'Carlos' },
  { id: 'm4', tipo: 'SAIDA',    itemNome: 'Luva Nitrílica P',   quantidade: -2,  unidade: 'cx',  hora: '11:30', usuario: 'Michel' },
  { id: 'm5', tipo: 'AJUSTE',   itemNome: 'Água Sanitária 5L',  quantidade: -1,  unidade: 'gl',  hora: '10:15', usuario: 'Ana'    },
  { id: 'm6', tipo: 'ENTRADA',  itemNome: 'Sabão em Pó 1kg',    quantidade: +12, unidade: 'fd',  hora: '09:05', usuario: 'Carlos' },
]
```

- [ ] **Step 7: Commit**

```bash
git add types/ lib/ __tests__/lib/
git commit -m "feat: types, pt-BR formatters and mock data for dashboard"
```

---

## Task 4: KpiCard + DonutMini

**Files:**
- Create: `components/dashboard/KpiCard.tsx`
- Create: `components/dashboard/DonutMini.tsx`
- Create: `__tests__/components/KpiCard.test.tsx`

- [ ] **Step 1: Escrever teste do KpiCard (TDD)**

```typescript
// __tests__/components/KpiCard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { TrendingUp } from 'lucide-react'

describe('KpiCard', () => {
  it('renderiza label e valor formatado', () => {
    render(
      <KpiCard
        label="Valor em estoque"
        value="R$ 42.830,00"
        delta={{ text: '↑ +12,4%', color: 'text-success' }}
        icon={<TrendingUp size={14} />}
      />
    )
    expect(screen.getByText('Valor em estoque')).toBeInTheDocument()
    expect(screen.getByText('R$ 42.830,00')).toBeInTheDocument()
    expect(screen.getByText('↑ +12,4%')).toBeInTheDocument()
  })

  it('renderiza delta com classe de cor correta', () => {
    render(
      <KpiCard
        label="Abaixo do mínimo"
        value="14"
        delta={{ text: '↓ +3', color: 'text-danger' }}
        icon={<TrendingUp size={14} />}
      />
    )
    const deltaEl = screen.getByText('↓ +3')
    expect(deltaEl).toHaveClass('text-danger')
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/components/KpiCard.test.tsx
```

Esperado: `Cannot find module '@/components/dashboard/KpiCard'`

- [ ] **Step 3: Criar `components/dashboard/KpiCard.tsx`**

```typescript
// components/dashboard/KpiCard.tsx
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  delta: { text: string; color: string }
  icon: React.ReactNode
  valueColor?: string
}

export function KpiCard({ label, value, delta, icon, valueColor }: KpiCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 cursor-pointer transition-colors hover:border-slate-600">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wide font-medium mb-1.5">
        <span className="text-slate-500">{icon}</span>
        {label}
      </div>
      <div className={cn('font-mono text-xl font-bold text-foreground leading-none mb-1.5', valueColor)}>
        {value}
      </div>
      <div className={cn('text-[11px] flex items-center gap-1', delta.color)}>
        {delta.text}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npm test -- __tests__/components/KpiCard.test.tsx
```

Esperado: `✓ 2 tests passed`

- [ ] **Step 5: Criar `components/dashboard/DonutMini.tsx`**

```typescript
// components/dashboard/DonutMini.tsx
import type { CategorySlice } from '@/types/dashboard'

interface DonutMiniProps {
  categories: CategorySlice[]
  size?: number
  strokeWidth?: number
}

export function DonutMini({ categories, size = 56, strokeWidth = 9 }: DonutMiniProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  let offset = 0
  const slices = categories.map((cat) => {
    const dash = (cat.percentual / 100) * circumference
    const gap = circumference - dash
    const slice = { ...cat, dash, gap, offset }
    offset += dash
    return slice
  })

  return (
    <div className="bg-card border border-border rounded-lg p-2 flex flex-col items-center justify-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        {/* slices */}
        {slices.map((s) => (
          <circle
            key={s.nome}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.cor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
      </svg>
      <span className="text-[9px] text-muted-foreground text-center leading-tight">
        Por<br />categoria
      </span>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/KpiCard.tsx components/dashboard/DonutMini.tsx __tests__/components/KpiCard.test.tsx
git commit -m "feat: KpiCard and DonutMini components"
```

---

## Task 5: MonthlyConsumptionChart

**Files:**
- Create: `components/dashboard/MonthlyConsumptionChart.tsx`

> Recharts requer `'use client'` pois usa hooks de browser.

- [ ] **Step 1: Criar `components/dashboard/MonthlyConsumptionChart.tsx`**

```typescript
// components/dashboard/MonthlyConsumptionChart.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { MonthlyData } from '@/types/dashboard'

interface Props {
  data: MonthlyData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-mono font-semibold text-foreground">
        {new Intl.NumberFormat('pt-BR').format(payload[0].value)} un
      </p>
    </div>
  )
}

export function MonthlyConsumptionChart({ data }: Props) {
  const lastIndex = data.length - 1

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-foreground">Consumo Mensal</p>
          <p className="text-[11px] text-muted-foreground">Últimos 6 meses · unidades</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
          Recharts
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="mes"
              stroke="hsl(var(--border))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--border))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--border)/0.3)' }} />
            <Bar dataKey="unidades" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === lastIndex ? '#22C55E' : '#3B82F6'}
                  opacity={i === lastIndex ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
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
git add components/dashboard/MonthlyConsumptionChart.tsx
git commit -m "feat: MonthlyConsumptionChart with Recharts + pt-BR tooltip"
```

---

## Task 6: AlertList

**Files:**
- Create: `components/dashboard/AlertList.tsx`
- Create: `__tests__/components/AlertList.test.tsx`

- [ ] **Step 1: Escrever testes da AlertList**

```typescript
// __tests__/components/AlertList.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AlertList } from '@/components/dashboard/AlertList'
import type { AlertItem } from '@/types/dashboard'

const mockAlerts: AlertItem[] = [
  { id: '1', severidade: 'CRITICO', mensagem: 'Álcool 70% zerado',        meta: 'Estoque: 0 un' },
  { id: '2', severidade: 'ALERTA',  mensagem: 'Detergente — reposição',   meta: 'Estoque: 12 un' },
  { id: '3', severidade: 'INFO',    mensagem: 'Inventário vence em 5 dias', meta: 'Ciclo mensal' },
]

describe('AlertList', () => {
  it('renderiza todos os alertas', () => {
    render(<AlertList alerts={mockAlerts} />)
    expect(screen.getByText('Álcool 70% zerado')).toBeInTheDocument()
    expect(screen.getByText('Detergente — reposição')).toBeInTheDocument()
    expect(screen.getByText('Inventário vence em 5 dias')).toBeInTheDocument()
  })

  it('mostra contagem de críticos no header', () => {
    render(<AlertList alerts={mockAlerts} />)
    expect(screen.getByText('1 crítico')).toBeInTheDocument()
  })

  it('renderiza estado vazio quando não há alertas', () => {
    render(<AlertList alerts={[]} />)
    expect(screen.getByText('Tudo em ordem')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/components/AlertList.test.tsx
```

Esperado: `Cannot find module '@/components/dashboard/AlertList'`

- [ ] **Step 3: Criar `components/dashboard/AlertList.tsx`**

```typescript
// components/dashboard/AlertList.tsx
import { cn } from '@/lib/utils'
import type { AlertItem, AlertSeverity } from '@/types/dashboard'
import { CheckCircle2 } from 'lucide-react'

const severityConfig: Record<AlertSeverity, {
  border: string; bg: string; dot: string; glow?: string
}> = {
  CRITICO: {
    border: 'border-l-danger',
    bg:     'bg-danger/5',
    dot:    'bg-danger',
    glow:   'shadow-[0_0_5px_hsl(var(--danger)/0.5)]',
  },
  ALERTA: {
    border: 'border-l-warning',
    bg:     'bg-warning/5',
    dot:    'bg-warning',
  },
  INFO: {
    border: 'border-l-primary',
    bg:     'bg-primary/5',
    dot:    'bg-primary',
  },
}

interface Props {
  alerts: AlertItem[]
}

export function AlertList({ alerts }: Props) {
  const criticalCount = alerts.filter((a) => a.severidade === 'CRITICO').length

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-2.5 flex-shrink-0">
        <p className="text-sm font-semibold text-foreground">Alertas</p>
        {criticalCount > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">
            {criticalCount} {criticalCount === 1 ? 'crítico' : 'críticos'}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-muted-foreground">
          <CheckCircle2 size={28} className="text-success" />
          <span className="text-sm">Tudo em ordem</span>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
          {alerts.map((alert) => {
            const cfg = severityConfig[alert.severidade]
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-2 px-2.5 py-2 rounded-md border-l-2 cursor-pointer',
                  'transition-colors hover:bg-surface-elevated',
                  cfg.border, cfg.bg
                )}
              >
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5',
                    cfg.dot, cfg.glow
                  )}
                />
                <div>
                  <p className="text-[11px] text-foreground leading-snug">{alert.mensagem}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{alert.meta}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npm test -- __tests__/components/AlertList.test.tsx
```

Esperado: `✓ 3 tests passed`

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/AlertList.tsx __tests__/components/AlertList.test.tsx
git commit -m "feat: AlertList with severity badges and empty state"
```

---

## Task 7: CriticalItemsList

**Files:**
- Create: `components/dashboard/CriticalItemsList.tsx`

- [ ] **Step 1: Criar `components/dashboard/CriticalItemsList.tsx`**

```typescript
// components/dashboard/CriticalItemsList.tsx
import { cn } from '@/lib/utils'
import type { CriticalItem } from '@/types/dashboard'

function getBarColor(pct: number): string {
  if (pct < 25) return 'bg-danger shadow-[0_0_4px_hsl(var(--danger)/0.4)]'
  if (pct < 50) return 'bg-warning'
  return 'bg-success'
}

function getQtyColor(pct: number): string {
  if (pct < 25) return 'text-danger'
  if (pct < 50) return 'text-warning'
  return 'text-success'
}

interface Props {
  items: CriticalItem[]
}

export function CriticalItemsList({ items }: Props) {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Itens Críticos</p>
        <span className="text-[11px] text-muted-foreground">saldo vs. mínimo</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => {
          const pct = item.estoqueMinimo > 0
            ? Math.round((item.estoqueAtual / item.estoqueMinimo) * 100)
            : 0
          return (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-foreground font-medium truncate max-w-[140px]">
                  {item.nome}
                </span>
                <span className={cn('font-mono text-[10px]', getQtyColor(pct))}>
                  {item.estoqueAtual} / {item.estoqueMinimo} {item.unidade}
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', getBarColor(pct))}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
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
git add components/dashboard/CriticalItemsList.tsx
git commit -m "feat: CriticalItemsList with semantic progress bars"
```

---

## Task 8: MovementsTable

**Files:**
- Create: `components/dashboard/MovementsTable.tsx`
- Create: `__tests__/components/MovementsTable.test.tsx`

- [ ] **Step 1: Escrever testes da MovementsTable**

```typescript
// __tests__/components/MovementsTable.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MovementsTable } from '@/components/dashboard/MovementsTable'
import type { MovementRow } from '@/types/dashboard'

const rows: MovementRow[] = [
  { id: '1', tipo: 'ENTRADA', itemNome: 'Detergente 500ml', quantidade: 24,  unidade: 'un',  hora: '13:58', usuario: 'Ana'    },
  { id: '2', tipo: 'SAIDA',   itemNome: 'Álcool 70% 1L',   quantidade: -4,  unidade: 'un',  hora: '14:22', usuario: 'Michel' },
  { id: '3', tipo: 'AJUSTE',  itemNome: 'Água Sanitária',  quantidade: -1,  unidade: 'gl',  hora: '10:15', usuario: 'Ana'    },
]

describe('MovementsTable', () => {
  it('renderiza todas as linhas', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('Detergente 500ml')).toBeInTheDocument()
    expect(screen.getByText('Álcool 70% 1L')).toBeInTheDocument()
    expect(screen.getByText('Água Sanitária')).toBeInTheDocument()
  })

  it('badge de ENTRADA tem texto correto', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('↑ Entrada')).toBeInTheDocument()
  })

  it('badge de SAIDA tem texto correto', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('↓ Saída')).toBeInTheDocument()
  })

  it('formata quantidade positiva com +', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('+24 un')).toBeInTheDocument()
  })

  it('formata quantidade negativa com −', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('−4 un')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npm test -- __tests__/components/MovementsTable.test.tsx
```

Esperado: `Cannot find module '@/components/dashboard/MovementsTable'`

- [ ] **Step 3: Criar `components/dashboard/MovementsTable.tsx`**

```typescript
// components/dashboard/MovementsTable.tsx
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { MovementRow, MovementType } from '@/types/dashboard'

const typeBadge: Record<MovementType, { label: string; classes: string }> = {
  ENTRADA:      { label: '↑ Entrada',      classes: 'bg-success/10 text-success border-success/20'  },
  SAIDA:        { label: '↓ Saída',        classes: 'bg-danger/10 text-danger border-danger/20'      },
  AJUSTE:       { label: '⟳ Ajuste',       classes: 'bg-primary/10 text-primary border-primary/20'  },
  TRANSFERENCIA:{ label: '⇄ Transferência',classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
}

function formatQty(quantidade: number, unidade: string): { text: string; color: string } {
  if (quantidade > 0) return { text: `+${quantidade} ${unidade}`, color: 'text-success' }
  return { text: `−${Math.abs(quantidade)} ${unidade}`, color: 'text-danger' }
}

interface Props {
  movements: MovementRow[]
}

export function MovementsTable({ movements }: Props) {
  return (
    <div className="bg-card border border-border rounded-lg flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-foreground">Últimas Movimentações</p>
          <p className="text-[11px] text-muted-foreground">Hoje</p>
        </div>
        <span className="text-[11px] text-primary cursor-pointer hover:underline">
          Ver todas →
        </span>
      </div>
      <div className="overflow-y-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Tipo</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Item</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Qtd</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Hora</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold h-8 px-3">Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((mov) => {
              const badge = typeBadge[mov.tipo]
              const qty   = formatQty(mov.quantidade, mov.unidade)
              return (
                <TableRow key={mov.id} className="border-border hover:bg-surface-elevated transition-colors">
                  <TableCell className="px-3 py-1.5">
                    <span className={cn(
                      'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      badge.classes
                    )}>
                      {badge.label}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-1.5 text-[11px] text-foreground">{mov.itemNome}</TableCell>
                  <TableCell className={cn('px-3 py-1.5 font-mono text-[11px]', qty.color)}>{qty.text}</TableCell>
                  <TableCell className="px-3 py-1.5 text-[11px] text-muted-foreground">{mov.hora}</TableCell>
                  <TableCell className="px-3 py-1.5 text-[11px] text-muted-foreground">{mov.usuario}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npm test -- __tests__/components/MovementsTable.test.tsx
```

Esperado: `✓ 5 tests passed`

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/MovementsTable.tsx __tests__/components/MovementsTable.test.tsx
git commit -m "feat: MovementsTable with shadcn Table and semantic type badges"
```

---

## Task 9: WarehouseSelector + AppSidebar + DashboardHeader

**Files:**
- Create: `components/dashboard/WarehouseSelector.tsx`
- Create: `components/dashboard/AppSidebar.tsx`
- Create: `components/dashboard/DashboardHeader.tsx`

- [ ] **Step 1: Criar `components/dashboard/WarehouseSelector.tsx`**

```typescript
// components/dashboard/WarehouseSelector.tsx
'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Warehouse } from '@/types/dashboard'

interface Props {
  warehouses: Warehouse[]
  selected: Warehouse
  onChange: (w: Warehouse) => void
}

export function WarehouseSelector({ warehouses, selected, onChange }: Props) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-[12px] text-slate-300 cursor-pointer hover:border-slate-600 transition-colors">
        <span className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          selected.online ? 'bg-success shadow-[0_0_4px_hsl(var(--success)/0.6)]' : 'bg-muted-foreground'
        )} />
        {selected.nome}
        <ChevronDown size={12} className="text-muted-foreground" />
      </button>
      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[200px] hidden group-focus-within:block z-50">
        {warehouses.map((w) => (
          <button
            key={w.id}
            onClick={() => onChange(w)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-surface-elevated transition-colors',
              w.id === selected.id ? 'text-primary' : 'text-foreground'
            )}
          >
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              w.online ? 'bg-success' : 'bg-muted-foreground'
            )} />
            {w.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar `components/dashboard/AppSidebar.tsx`**

```typescript
// components/dashboard/AppSidebar.tsx
import Link from 'next/link'
import {
  LayoutDashboard, Package, ArrowLeftRight, ShoppingBag,
  BarChart3, Users, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',               icon: LayoutDashboard, label: 'Dashboard'      },
  { href: '/produtos',       icon: Package,         label: 'Produtos'       },
  { href: '/movimentacoes',  icon: ArrowLeftRight,  label: 'Movimentações'  },
  { href: '/compras',        icon: ShoppingBag,     label: 'Compras'        },
]

const bottomItems = [
  { href: '/relatorios',    icon: BarChart3, label: 'Relatórios'    },
  { href: '/fornecedores',  icon: Users,     label: 'Fornecedores'  },
  { href: '/configuracoes', icon: Settings,  label: 'Configurações' },
]

interface NavIconProps {
  href: string
  icon: React.ElementType
  label: string
  active?: boolean
}

function NavIcon({ href, icon: Icon, label, active }: NavIconProps) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
      )}
    >
      <Icon size={18} />
    </Link>
  )
}

interface Props {
  activeHref?: string
}

export function AppSidebar({ activeHref = '/' }: Props) {
  return (
    <aside className="w-[52px] bg-card border-r border-border flex flex-col items-center py-3 gap-1 flex-shrink-0">
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-primary flex items-center justify-center text-white font-bold text-sm mb-4 flex-shrink-0">
        A
      </div>

      {/* Nav principal */}
      {navItems.map((item) => (
        <NavIcon key={item.href} {...item} active={activeHref === item.href} />
      ))}

      <div className="w-6 h-px bg-border my-1.5" />

      {/* Nav secundária */}
      {bottomItems.map((item) => (
        <NavIcon key={item.href} {...item} active={activeHref === item.href} />
      ))}

      <div className="flex-1" />

      {/* Almoxarifado indicator */}
      <div
        title="Almoxarifado Principal"
        className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center cursor-pointer hover:border-slate-600 transition-colors"
      >
        <span className="text-[8px] font-bold text-muted-foreground text-center leading-tight">
          ALM
        </span>
      </div>

      {/* Avatar */}
      <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold mt-1 cursor-pointer">
        M
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Criar `components/dashboard/DashboardHeader.tsx`**

```typescript
// components/dashboard/DashboardHeader.tsx
'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WarehouseSelector } from './WarehouseSelector'
import { mockWarehouses } from '@/lib/mock-data/dashboard'
import type { Warehouse } from '@/types/dashboard'

interface Props {
  title?: string
  breadcrumb?: string
  alertCount?: number
}

export function DashboardHeader({
  title = 'Dashboard',
  breadcrumb = 'Visão Geral',
  alertCount = 0,
}: Props) {
  const [selected, setSelected] = useState<Warehouse>(mockWarehouses[0])

  return (
    <header className="h-11 bg-card border-b border-border flex items-center px-4 gap-2.5 flex-shrink-0">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="w-px h-4 bg-border" />
      <span className="text-xs text-muted-foreground">{breadcrumb}</span>
      <div className="flex-1" />

      <WarehouseSelector
        warehouses={mockWarehouses}
        selected={selected}
        onChange={setSelected}
      />

      {/* Notifications */}
      <div className="relative w-8 h-8 bg-surface border border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-600 transition-colors">
        <Bell size={14} className="text-muted-foreground" />
        {alertCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full border border-card shadow-[0_0_5px_hsl(var(--danger)/0.6)]" />
        )}
      </div>

      {/* User avatar */}
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer">
        M
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/
git commit -m "feat: WarehouseSelector, AppSidebar and DashboardHeader"
```

---

## Task 10: Dashboard Page — Grid Bento + Layout

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/page.tsx`
- Create: `app/(dashboard)/loading.tsx`

- [ ] **Step 1: Criar `app/(dashboard)/layout.tsx`**

```typescript
// app/(dashboard)/layout.tsx
import { AppSidebar } from '@/components/dashboard/AppSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { mockAlerts } from '@/lib/mock-data/dashboard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const criticalCount = mockAlerts.filter((a) => a.severidade === 'CRITICO').length

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar activeHref="/" />
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardHeader alertCount={criticalCount} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar `app/(dashboard)/page.tsx`**

```typescript
// app/(dashboard)/page.tsx
import { KpiCard }                  from '@/components/dashboard/KpiCard'
import { DonutMini }                from '@/components/dashboard/DonutMini'
import { MonthlyConsumptionChart }  from '@/components/dashboard/MonthlyConsumptionChart'
import { AlertList }                from '@/components/dashboard/AlertList'
import { CriticalItemsList }        from '@/components/dashboard/CriticalItemsList'
import { MovementsTable }           from '@/components/dashboard/MovementsTable'
import {
  DollarSign, Package, AlertTriangle, ArrowLeftRight,
} from 'lucide-react'
import { formatCurrency, formatNumber, formatDelta } from '@/lib/format'
import {
  mockKpi, mockCategories, mockMonthlyData,
  mockAlerts, mockCriticalItems, mockMovements,
} from '@/lib/mock-data/dashboard'

export default function DashboardPage() {
  const { valorEstoque, itensCadastrados, itensAbaixoMinimo, saidasHoje, deltas } = mockKpi

  return (
    <div className="h-full p-3.5 flex flex-col gap-3 overflow-hidden">

      {/* ── KPI ROW ── */}
      <div className="grid gap-2.5 flex-shrink-0"
        style={{ gridTemplateColumns: 'repeat(4, 1fr) 88px' }}>

        <KpiCard
          label="Valor em estoque"
          value={formatCurrency(valorEstoque)}
          delta={formatDelta(deltas.valorEstoque.value, deltas.valorEstoque.direction, deltas.valorEstoque.suffix)}
          icon={<DollarSign size={13} />}
        />
        <KpiCard
          label="Itens cadastrados"
          value={formatNumber(itensCadastrados)}
          delta={formatDelta(deltas.itensCadastrados.value, deltas.itensCadastrados.direction, deltas.itensCadastrados.suffix)}
          icon={<Package size={13} />}
          valueColor="text-primary"
        />
        <KpiCard
          label="Abaixo do mínimo"
          value={String(itensAbaixoMinimo)}
          delta={formatDelta(deltas.itensAbaixoMinimo.value, deltas.itensAbaixoMinimo.direction, deltas.itensAbaixoMinimo.suffix)}
          icon={<AlertTriangle size={13} />}
          valueColor="text-danger"
        />
        <KpiCard
          label="Saídas hoje"
          value={String(saidasHoje)}
          delta={formatDelta(deltas.saidasHoje.value, deltas.saidasHoje.direction)}
          icon={<ArrowLeftRight size={13} />}
          valueColor="text-warning"
        />
        <DonutMini categories={mockCategories} />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid gap-2.5 flex-1 min-h-0"
        style={{ gridTemplateColumns: '1fr 1fr 260px' }}>

        {/* Gráfico barras */}
        <MonthlyConsumptionChart data={mockMonthlyData} />

        {/* Tabela movimentações */}
        <MovementsTable movements={mockMovements} />

        {/* Coluna direita */}
        <div className="flex flex-col gap-2.5 overflow-hidden">
          <AlertList alerts={mockAlerts} />
          <CriticalItemsList items={mockCriticalItems} />
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar `app/(dashboard)/loading.tsx`**

```typescript
// app/(dashboard)/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="h-full p-3.5 flex flex-col gap-3">
      {/* KPI skeletons */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(4, 1fr) 88px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg bg-surface" />
        ))}
      </div>
      {/* Main grid skeletons */}
      <div className="grid gap-2.5 flex-1" style={{ gridTemplateColumns: '1fr 1fr 260px' }}>
        <Skeleton className="rounded-lg bg-surface" />
        <Skeleton className="rounded-lg bg-surface" />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="flex-1 rounded-lg bg-surface" />
          <Skeleton className="h-40 rounded-lg bg-surface" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Remover `app/page.tsx` default e redirecionar para dashboard**

Substitua o conteúdo de `app/page.tsx`:
```typescript
// app/page.tsx
import { redirect } from 'next/navigation'
export default function Home() { redirect('/') }
```

Na verdade, a rota `(dashboard)/page.tsx` já está em `/`, então o `app/page.tsx` deve ser removido para evitar conflito:
```bash
rm app/page.tsx
```

- [ ] **Step 5: Verificar build completo**

```bash
npm run build
```

Esperado: `✓ Compiled successfully` sem erros de TypeScript.

- [ ] **Step 6: Rodar todos os testes**

```bash
npm test
```

Esperado: todos os testes passam.

- [ ] **Step 7: Subir servidor de dev e verificar visual**

```bash
npm run dev
```

Abrir `http://localhost:3000`. Verificar:
- [ ] Sidebar com ícones Lucide visível
- [ ] 4 KPI cards + donut mini na mesma linha
- [ ] Gráfico de barras com 6 meses
- [ ] Tabela de movimentações com badges coloridos
- [ ] Coluna direita: alertas + itens críticos com progress bar
- [ ] Background #000 (OLED) sem fundo branco em nenhum elemento
- [ ] Valores monetários em Fira Code (verificar no DevTools: font-family)

- [ ] **Step 8: Commit final**

```bash
git add app/
git commit -m "feat: Dashboard admin page — Bento grid layout with all sections"
```

---

## Task 11: Responsividade

**Files:**
- Modify: `app/(dashboard)/page.tsx`
- Modify: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Ajustar KPI row para 2×2 em telas menores**

No `app/(dashboard)/page.tsx`, substitua o div do KPI row:

```typescript
{/* ── KPI ROW ── */}
<div className="grid grid-cols-2 lg:grid-cols-[repeat(4,1fr)_88px] gap-2.5 flex-shrink-0">
  {/* ... cards ... */}
  <div className="col-span-2 lg:col-span-1">
    <DonutMini categories={mockCategories} />
  </div>
</div>
```

- [ ] **Step 2: Ajustar main grid para coluna única em < 1024px**

No mesmo arquivo, substitua o div do main grid:

```typescript
{/* ── MAIN GRID ── */}
<div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_260px] gap-2.5 flex-1 min-h-0 overflow-auto xl:overflow-hidden">
```

- [ ] **Step 3: Ocultar sidebar em mobile, mostrar bottom nav (simplificado)**

No `app/(dashboard)/layout.tsx`:
```typescript
<AppSidebar activeHref="/" />
```
Envolva com classe de visibilidade:
```typescript
<div className="hidden lg:block">
  <AppSidebar activeHref="/" />
</div>
```

- [ ] **Step 4: Verificar em 375px, 768px, 1024px, 1440px**

No DevTools (F12) do Chrome, use o modo responsivo e verifique cada breakpoint:
- 375px: cards em coluna única, sem scroll horizontal
- 768px: 2 colunas nos KPIs, gráfico em coluna única
- 1024px: sidebar aparece, grid ainda em coluna
- 1440px: layout bento completo com 3 colunas

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/
git commit -m "feat: responsive breakpoints for dashboard (375px→1440px)"
```

---

## Verificação Final

- [ ] **Rodar todos os testes**

```bash
npm test
```

Esperado: todos passam.

- [ ] **Build de produção**

```bash
npm run build
```

Esperado: `✓ Compiled successfully` sem warnings críticos.

- [ ] **Pré-checagem UI (design spec §9)**

| Item | Verificação |
|------|-------------|
| Nenhum emoji como ícone | `grep -r "🔴\|🟢\|⚠️\|✅" components/` deve retornar vazio |
| cursor-pointer em elementos clicáveis | Inspecionar KpiCard, AlertList, nav icons no DevTools |
| Hover sem scale | `grep -r "hover:scale" components/` deve retornar vazio |
| Fira Code em números | DevTools → Elements → KPI value → Computed → font-family: Fira Code |
| Contraste texto | DevTools → Accessibility → verificar valores brancos sobre #000 |
| Sem fundo claro | `grep -r "bg-white\|bg-slate-50\|bg-gray-50" app/ components/` deve retornar vazio |
| shadcn Table (não div-grid) | Ver MovementsTable.tsx — usar `<Table>` correto ✓ |
| Locale pt-BR | Inspecionar valores de moeda: "R$ 42.830,00" com vírgula decimal |

- [ ] **Commit final**

```bash
git add .
git commit -m "chore: final verification — all checks passing"
```
