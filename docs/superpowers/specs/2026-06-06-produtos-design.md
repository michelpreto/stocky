# AlmoxControl — Módulo de Produtos · Design Spec

**Data:** 2026-06-06
**Status:** Aprovado
**Fase do produto:** MVP (v0.1) — "Substituir a planilha"
**Referência:** `almoxcontrol-CLAUDE.md` §2.1 RF-01, RF-02, RF-08, §3.4, §3.5

---

## 1. Objetivo

Construir o módulo de cadastro e listagem de produtos do AlmoxControl. É o catálogo central que sustenta todo o sistema: baixas, compras, inventário e alertas dependem dos dados de produto. O foco do MVP é importar a realidade da planilha (embalagem composta, custo unitário, estoque mínimo) com tolerância a cadastros incompletos (rascunho).

---

## 2. Rotas

```
app/(dashboard)/
  produtos/
    page.tsx          ← ProductsPage: listagem + filtros + paginação
    loading.tsx       ← Skeleton da tabela
```

O formulário abre como **sheet lateral** (`<Sheet>` do shadcn/ui) sobre a listagem — sem troca de rota. Isso mantém o contexto da listagem visível atrás do sheet.

---

## 3. Design System

Herda todos os tokens OLED dark do `globals.css`. Sem overrides de cor — apenas uso correto dos tokens existentes.

### 3.1 Badges de status de estoque

| Status | Condição | Classes |
|--------|----------|---------|
| `Normal` | `estoqueAtual >= estoqueMinimo` | `bg-success/10 text-success border-success/20` |
| `Baixo` | `estoqueAtual >= estoqueMinimo * 0.5 && < estoqueMinimo` | `bg-warning/10 text-warning border-warning/20` |
| `Crítico` | `estoqueAtual > 0 && < estoqueMinimo * 0.5` | `bg-danger/10 text-danger border-danger/20` |
| `Zerado` | `estoqueAtual === 0` | `bg-muted text-muted-foreground border-border` |
| `Rascunho` | `produto.ativo === false` | `bg-surface-elevated text-muted-foreground border-border` |

### 3.2 Tipografia específica

- Números (estoque, custo, fator): `font-mono` (Fira Code)
- Código interno: `font-mono text-xs text-muted-foreground`
- Código de embalagem (ex: `GL-5L`): `font-mono text-xs`

### 3.3 Anti-padrões proibidos

- `bg-white` / `bg-slate-50` em qualquer elemento do módulo
- Números sem `font-mono` (quebra alinhamento de colunas)
- `hover:scale` nas linhas da tabela (usa `hover:bg-surface-elevated`)
- Fator de conversão sem widget de preview ao vivo
- Submit sem Zod validation + sem estado de loading no botão
- Duas abas abertas simultaneamente no sheet (apenas uma ativa)

---

## 4. Modelo de dados (mock, derivado do CLAUDE.md §3.4)

```typescript
// types/product.ts

export type TipoEmbalagem =
  | 'FARDO' | 'GALAO' | 'CAIXA' | 'PACOTE' | 'PAR'
  | 'UNIDADE' | 'ROLO' | 'SACO' | 'BISNAGA' | 'FRASCO'

export type UnidadeConsumo =
  | 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'PAR' | 'CX'

export type ControlarPor = 'EMBALAGEM' | 'CONSUMO'

export type StockStatus = 'normal' | 'baixo' | 'critico' | 'zerado' | 'rascunho'

export interface Category {
  id: string
  nome: string
  cor?: string
}

export interface ProductWarehouse {
  estoqueAtual: number
  estoqueMinimo: number
  estoqueMaximo?: number
  pontoReposicao?: number
  localizacao?: string
}

export interface Product {
  id: string
  codigoInterno?: string           // opcional — null = rascunho
  nome: string
  codigoBarras?: string
  categoryId: string
  category?: Category
  tipoEmbalagem: TipoEmbalagem
  unidadeConsumo: UnidadeConsumo
  fatorEmbalagem: number           // ex: 5 (1 galão = 5 litros)
  controlarPor: ControlarPor       // 'EMBALAGEM' = padrão planilha
  descricaoEmbalagem?: string      // ex: "GL-5L" (auto-gerado)
  custoUnitario?: number
  foto?: string
  fichaSeguranca?: string
  ativo: boolean                   // false = rascunho
  warehouse?: ProductWarehouse     // dados do estoque atual
  createdAt: string
  updatedAt: string
}

// Status calculado (não armazenado)
export function getStockStatus(product: Product): StockStatus {
  if (!product.ativo || !product.codigoInterno) return 'rascunho'
  const w = product.warehouse
  if (!w) return 'rascunho'
  if (w.estoqueAtual === 0) return 'zerado'
  if (w.estoqueAtual < w.estoqueMinimo * 0.5) return 'critico'
  if (w.estoqueAtual < w.estoqueMinimo) return 'baixo'
  return 'normal'
}

// Código de embalagem auto-gerado
export function gerarDescricaoEmbalagem(tipo: TipoEmbalagem, fator: number, unidade: UnidadeConsumo): string {
  const prefixos: Record<TipoEmbalagem, string> = {
    FARDO:'FD', GALAO:'GL', CAIXA:'CX', PACOTE:'PCT', PAR:'PR',
    UNIDADE:'UN', ROLO:'RL', SACO:'SC', BISNAGA:'BG', FRASCO:'FR',
  }
  return `${prefixos[tipo]}-${fator}${unidade}`
  // ex: GL-5L, FD-10KG, PCT-100UN
}
```

---

## 5. Validação Zod

```typescript
// lib/validations/product.ts
import { z } from 'zod'

export const productSchema = z.object({
  codigoInterno: z.string().max(20).optional().or(z.literal('')),
  codigoBarras:  z.string().max(50).optional().or(z.literal('')),
  nome:          z.string().min(2, 'Nome obrigatório').max(120),
  categoryId:    z.string().min(1, 'Categoria obrigatória'),
  tipoEmbalagem: z.enum(['FARDO','GALAO','CAIXA','PACOTE','PAR','UNIDADE','ROLO','SACO','BISNAGA','FRASCO']),
  unidadeConsumo:z.enum(['UN','KG','G','L','ML','M','CM','PAR','CX']),
  fatorEmbalagem:z.number().min(0.001, 'Fator deve ser > 0').max(10_000),
  controlarPor:  z.enum(['EMBALAGEM','CONSUMO']),
  custoUnitario: z.number().min(0).optional(),
  // Estoque
  estoqueAtual:  z.number().min(0).optional(),
  estoqueMinimo: z.number().min(0).optional(),
  estoqueMaximo: z.number().min(0).optional(),
  pontoReposicao:z.number().min(0).optional(),
  localizacao:   z.string().max(60).optional(),
  ativo:         z.boolean(),
})

export type ProductFormValues = z.infer<typeof productSchema>

// Rascunho: apenas nome obrigatório
export const draftSchema = productSchema.pick({ nome: true, categoryId: true, ativo: true })
  .extend({ nome: z.string().min(1) })
```

---

## 6. Componentes

### 6.1 `ProductsPage` (`app/(dashboard)/produtos/page.tsx`)

Client Component. Estado central da página:

```typescript
interface PageState {
  query: string
  categoryId: string        // '' = todos
  statusFilter: StockStatus | ''
  sortField: keyof Product | 'estoqueAtual'
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: 10 | 25 | 50
  sheetOpen: boolean
  editingProduct: Product | null   // null = novo
}
```

Renderiza:
1. `<ProductsHeader>` — título + botões
2. `<ProductsFilters>` — busca + dropdowns + chips
3. `<ProductsSummary>` — contadores
4. `<ProductsTable>` — tabela + loading/empty/error
5. `<ProductsPagination>` — paginação
6. `<ProductSheet>` — sheet lateral (conditional render)

### 6.2 `ProductsHeader`

```typescript
interface Props {
  total: number
  onNew: () => void
  onExport: () => void
}
```

Botão "Exportar Excel": chama `exportToExcel(products)` do `lib/excel.ts` (SheetJS). Baixa `almoxcontrol-produtos-YYYY-MM-DD.xlsx`.

### 6.3 `ProductsFilters`

```typescript
interface Props {
  query: string; onQueryChange: (v: string) => void
  categoryId: string; onCategoryChange: (v: string) => void
  statusFilter: string; onStatusChange: (v: string) => void
  categories: Category[]
  activeFilters: ActiveFilter[]   // para chips de "filtro ativo"
  onClearFilter: (key: string) => void
}
```

- `<input>` com debounce 200ms para query
- Chips removíveis para filtros ativos (`× Limpeza`, `× Crítico`)
- `aria-label` em todos os controles

### 6.4 `ProductsSummary`

Linha de texto com contadores calculados da listagem filtrada:
- Total · Filtrado · Críticos · Baixo estoque
- Usa `useMemo` para não recalcular em todo render

### 6.5 `ProductsTable`

- shadcn `<Table>` (nunca div-grid)
- Colunas: Código · Nome · Categoria · Embalagem · Estoque · Status · Custo Unit. · Ações
- Coluna Embalagem: chip `GL-5L` (`font-mono text-xs`) — gerado por `gerarDescricaoEmbalagem()`
- Coluna Estoque: valor colorido por status (`text-success/warning/danger`)
- Coluna Status: `<StatusBadge status={getStockStatus(p)} />`
- Linha com `ativo=false`: texto em `text-muted-foreground italic`
- Botão editar: abre `ProductSheet` com produto; botão ⋯: menu de contexto (ações futuras)
- Clique na linha: abre sheet de edição
- `cursor-pointer` em toda linha

**Estados internos:**
- Loading: `<ProductsTableSkeleton>` — 8 linhas de skeleton com `animate-pulse`
- Empty: ilustração SVG + texto + botão "Novo Produto"
- Error: ícone de alerta + mensagem + botão "Tentar novamente"

### 6.6 `StatusBadge`

```typescript
interface Props {
  status: StockStatus
  size?: 'sm' | 'md'
}
```

Mapeia status → classes Tailwind. Sem lógica extra.

### 6.7 `PackagingChip`

```typescript
interface Props {
  tipoEmbalagem: TipoEmbalagem
  fatorEmbalagem: number
  unidadeConsumo: UnidadeConsumo
}
```

Renderiza `GL-5L` usando `gerarDescricaoEmbalagem()`. `font-mono text-xs bg-surface-elevated`.

### 6.8 `ProductSheet`

```typescript
interface Props {
  open: boolean
  product: Product | null     // null = modo criação
  categories: Category[]
  onClose: () => void
  onSave: (data: ProductFormValues) => Promise<void>
}
```

Sheet com `<Tabs>` (shadcn) de 4 abas:

| Aba | Campos |
|-----|--------|
| **Dados Gerais** | codigoInterno (opcional), codigoBarras, nome*, categoryId*, ativo (toggle) |
| **Estoque** | estoqueAtual, estoqueMinimo*, estoqueMaximo, pontoReposicao, localizacao, custoUnitario |
| **Embalagem** | tipoEmbalagem*, unidadeConsumo*, fatorEmbalagem* (número), controlarPor, descricaoEmbalagem (read-only, auto-gerado), `<PackagingPreview>` |
| **Mídia** | foto (upload futuro — placeholder no MVP), fichaSeguranca (upload futuro) |

**Gerenciamento de estado:** `react-hook-form` com `resolver` Zod. Um único `useForm` para todas as abas. Erros de cada aba ficam indicados na tab com ponto vermelho.

**Footer:** Cancelar · Salvar como Rascunho · Salvar Produto
- "Salvar como Rascunho": valida apenas `draftSchema` (nome + categoria)
- "Salvar Produto": valida `productSchema` completo
- Botão de salvar: disabled + spinner durante `isPending`

### 6.9 `PackagingPreview`

Widget ao vivo dentro da aba Embalagem. Recebe os valores em tempo real via `useWatch` do `react-hook-form`:

```typescript
// Atualiza conforme o usuário digita
const tipo   = useWatch({ name: 'tipoEmbalagem' })
const fator  = useWatch({ name: 'fatorEmbalagem' })
const unidade = useWatch({ name: 'unidadeConsumo' })
```

Exibe:
```
1 GALÃO = 5 L
─────────────────────────────────
Entrada de 12 galões → +60 L ao estoque
Baixa de 2 galões   → −10 L do estoque
─────────────────────────────────
Código: GL-5L
```

Atualização imediata (sem debounce) — o preview é o feedback de que o fator está correto.

---

## 7. Exportação Excel

```typescript
// lib/excel.ts
import * as XLSX from 'xlsx'

export function exportToExcel(products: Product[]): void {
  const rows = products.map((p) => ({
    'Código':      p.codigoInterno ?? '',
    'Nome':        p.nome,
    'Categoria':   p.category?.nome ?? '',
    'Embalagem':   gerarDescricaoEmbalagem(p.tipoEmbalagem, p.fatorEmbalagem, p.unidadeConsumo),
    'Estoque':     p.warehouse?.estoqueAtual ?? '',
    'Mínimo':      p.warehouse?.estoqueMinimo ?? '',
    'Custo Unit.': p.custoUnitario ?? '',
    'Status':      getStockStatus(p),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos')

  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `almoxcontrol-produtos-${date}.xlsx`)
}
```

---

## 8. Filtro e Paginação (client-side)

```typescript
// lib/filter-products.ts
export function filterAndSortProducts(
  products: Product[],
  { query, categoryId, statusFilter, sortField, sortDir }: FilterState
): Product[] {
  let result = products

  if (query.trim()) {
    const q = query.toLowerCase()
    result = result.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.codigoInterno ?? '').toLowerCase().includes(q) ||
        (p.codigoBarras ?? '').includes(q)
    )
  }

  if (categoryId) result = result.filter((p) => p.categoryId === categoryId)

  if (statusFilter) result = result.filter((p) => getStockStatus(p) === statusFilter)

  result.sort((a, b) => {
    const va = getSortValue(a, sortField)
    const vb = getSortValue(b, sortField)
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })

  return result
}

function getSortValue(p: Product, field: string): string | number {
  switch (field) {
    case 'nome':          return p.nome.toLowerCase()
    case 'codigoInterno': return p.codigoInterno ?? ''
    case 'estoqueAtual':  return p.warehouse?.estoqueAtual ?? -1
    case 'custoUnitario': return p.custoUnitario ?? -1
    default:              return ''
  }
}

  return result
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize)
}
```

---

## 9. Estrutura de arquivos

```
app/(dashboard)/produtos/
  page.tsx                        ← ProductsPage ('use client')
  loading.tsx                     ← ProductsTableSkeleton

components/products/
  ProductsHeader.tsx              ← título + botões
  ProductsFilters.tsx             ← busca + dropdowns + chips
  ProductsSummary.tsx             ← contadores
  ProductsTable.tsx               ← tabela principal
  ProductsTableSkeleton.tsx       ← skeleton loading
  ProductsPagination.tsx          ← paginação
  StatusBadge.tsx                 ← badge de status
  PackagingChip.tsx               ← chip de embalagem GL-5L
  ProductSheet.tsx                ← sheet lateral (4 abas)
  PackagingPreview.tsx            ← widget ao vivo da embalagem

types/
  product.ts                      ← interfaces + funções puras

lib/
  validations/product.ts          ← schemas Zod
  filter-products.ts              ← filtragem + ordenação + paginação
  excel.ts                        ← exportação XLSX
  mock-data/products.ts           ← dados mockados

__tests__/products/
  filter-products.test.ts         ← testes de filtragem + ordenação
  product-utils.test.ts           ← testes de getStockStatus + gerarDescricaoEmbalagem
  StatusBadge.test.tsx            ← testes de render por status
  PackagingPreview.test.tsx       ← testes do widget de conversão
  product-schema.test.ts          ← testes dos schemas Zod
```

---

## 10. Mock data

```typescript
// lib/mock-data/products.ts
export const mockCategories: Category[] = [
  { id: 'c1', nome: 'Limpeza',      cor: '#3B82F6' },
  { id: 'c2', nome: 'Copa',         cor: '#22C55E' },
  { id: 'c3', nome: 'EPI',          cor: '#F59E0B' },
  { id: 'c4', nome: 'Descartáveis', cor: '#A855F7' },
  { id: 'c5', nome: 'Ferramentas',  cor: '#64748B' },
]

export const mockProducts: Product[] = [
  {
    id: 'p1', codigoInterno: '00034', nome: 'Álcool 70% 1L Talge',
    codigoBarras: '7891082036424', categoryId: 'c1',
    tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'UN', fatorEmbalagem: 1,
    controlarPor: 'EMBALAGEM', custoUnitario: 4.50, ativo: true,
    warehouse: { estoqueAtual: 8, estoqueMinimo: 20 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p2', codigoInterno: '00041', nome: 'Água Sanitária 5L Talge',
    categoryId: 'c1', tipoEmbalagem: 'GALAO', unidadeConsumo: 'L',
    fatorEmbalagem: 5, controlarPor: 'EMBALAGEM', custoUnitario: 12.80, ativo: true,
    warehouse: { estoqueAtual: 2, estoqueMinimo: 8 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p3', codigoInterno: '00078', nome: 'Luva Nitrílica P',
    categoryId: 'c3', tipoEmbalagem: 'CAIXA', unidadeConsumo: 'UN',
    fatorEmbalagem: 100, controlarPor: 'EMBALAGEM', custoUnitario: 89.00, ativo: true,
    warehouse: { estoqueAtual: 1, estoqueMinimo: 6 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p4', codigoInterno: '00092', nome: 'Papel Toalha PCT c/2',
    categoryId: 'c1', tipoEmbalagem: 'PACOTE', unidadeConsumo: 'UN',
    fatorEmbalagem: 2, controlarPor: 'EMBALAGEM', custoUnitario: 6.20, ativo: true,
    warehouse: { estoqueAtual: 4, estoqueMinimo: 12 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p5', nome: 'Esponja de Aço',
    categoryId: 'c1', tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'UN',
    fatorEmbalagem: 1, controlarPor: 'EMBALAGEM', ativo: false,
    createdAt: '2026-06-05T10:00:00Z', updatedAt: '2026-06-05T10:00:00Z',
  },
  {
    id: 'p6', codigoInterno: '00015', nome: 'Detergente 500ml',
    categoryId: 'c1', tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'ML',
    fatorEmbalagem: 500, controlarPor: 'EMBALAGEM', custoUnitario: 2.90, ativo: true,
    warehouse: { estoqueAtual: 12, estoqueMinimo: 15 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p7', codigoInterno: '00023', nome: 'Sabão em Pó 1kg',
    categoryId: 'c1', tipoEmbalagem: 'FARDO', unidadeConsumo: 'KG',
    fatorEmbalagem: 10, controlarPor: 'EMBALAGEM', custoUnitario: 8.50, ativo: true,
    warehouse: { estoqueAtual: 25, estoqueMinimo: 10 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
]
```

---

## 11. Dependências a instalar

```bash
npm install zod react-hook-form @hookform/resolvers xlsx
npx shadcn@latest add tabs
```

- `zod` — validação
- `react-hook-form` + `@hookform/resolvers` — gerenciamento de form com Zod
- `xlsx` (SheetJS) — exportação Excel
- shadcn `tabs` — abas do formulário

---

## 12. Pré-checagem de UI

| Critério | Status | Detalhe |
|----------|--------|---------|
| Contraste texto principal | ✅ | #F1F5F9 / #000 = 16:1 |
| Badges com borda + cor | ✅ | Nunca só cor como indicador |
| `cursor-pointer` nas linhas | ✅ | `tbody tr { cursor: pointer }` |
| `hover:bg-surface-elevated` (não scale) | ✅ | Sem layout shift |
| `font-mono` em números | ✅ | Estoque, custo, fator |
| Erros Zod inline (não toast) | ✅ | Abaixo de cada campo |
| Aba com erro: indicador visual | ✅ | Ponto vermelho na tab com erro |
| Sheet com focus trap | ✅ | shadcn Sheet já implementa |
| Botão salvar: disabled durante submit | ✅ | `isPending` do useFormState |
| Export Excel: feedback visual | ✅ | Toast "Exportando..." |
| Empty state: CTA para criar | ✅ | Botão "Novo Produto" no empty |
| Rascunho: aparência diferente na tabela | ✅ | Itálico + muted + badge ◌ |
