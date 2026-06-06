# AlmoxControl — Dashboard Administrativo · Design Spec

**Data:** 2026-06-05
**Status:** Aprovado
**Fase do produto:** MVP (v0.1) — "Substituir a planilha"
**Referência:** `almoxcontrol-CLAUDE.md` §2, §4

---

## 1. Objetivo

Construir o dashboard administrativo do AlmoxControl: a tela de entrada do perfil Admin (CLAUDE.md §4.2). Ela deve entregar visão consolidada em tempo real do estoque, alertas prioritários e histórico de movimentações — sem exigir navegação por outras telas para o ciclo diário do gestor.

---

## 2. Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Estilo | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Ícones | Lucide React (SVG — sem emojis) |
| Fontes | Inter (UI) + Fira Code (números/KPIs) |
| Locale | pt-BR — `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` |

---

## 3. Design System

### 3.1 Paleta OLED Dark

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg` | `#000000` | Background principal (OLED) |
| `--surface` | `#0D1117` | Cards, sidebar, topbar |
| `--surface-elevated` | `#161B22` | Cards elevados, hover |
| `--border` | `#1E293B` | Bordas, divisores |
| `--primary` | `#3B82F6` | Ações primárias, dados |
| `--accent` | `#F59E0B` | CTAs, destaques |
| `--text-primary` | `#F1F5F9` | Texto principal (contraste 16:1 sobre #000) |
| `--text-muted` | `#64748B` | Labels, captions (contraste 5,9:1) |

### 3.2 Cores Semânticas (CLAUDE.md §2.4)

| Cor | Hex | Significado |
|-----|-----|-------------|
| Verde | `#22C55E` | Entrada / OK / Sucesso |
| Vermelho | `#EF4444` | Saída / Crítico / Erro |
| Âmbar | `#F59E0B` | Alerta / Atenção |
| Azul | `#3B82F6` | Info / Dados |
| Roxo | `#A855F7` | Transferência / Neutro |

### 3.3 Tipografia

- **Headings / seções:** Inter 600–700
- **Body / tabelas:** Inter 400–500 · 14px mínimo
- **Números / KPIs / moeda:** Fira Code (monospace — alinha decimais)
- **Escala:** 24px H1, 18px H2, 14px body, 12px caption, 10px label uppercase

### 3.4 Anti-padrões proibidos

- `bg-white` ou qualquer fundo claro no dark mode
- Emojis como ícones (apenas Lucide React SVG)
- `scale` em hover de cards (causa layout shift — usar `box-shadow` + `border-color`)
- Números financeiros com fonte sans-serif (sempre Fira Code)
- Cores semânticas invertidas (verde ≠ entrada em qualquer lugar)
- Texto abaixo de `#64748B` como cor de conteúdo (contraste insuficiente)
- Datas/moedas fora do padrão pt-BR (`dd/mm/aaaa`, `R$ 1.234,56`)
- Transições ausentes (mínimo `transition-colors duration-200`)

---

## 4. Layout — Grid Bento Denso (Opção B)

Layout aprovado em brainstorming visual. Tudo visível sem scroll em 1440×900px.

```
┌─────────────────────────────────────────────────────────────────┐
│ SIDEBAR (52px)  │  TOPBAR (44px)                                 │
│                 ├─────────────────────────────────────────────── │
│  Logo           │  KPI   │ KPI   │ KPI   │ KPI   │ Donut        │
│  nav-icon ×7    ├───────────────────────┬─────────────────────── │
│  separator      │  Gráfico Barras       │ Alertas               │
│  warehouse btn  │  (consumo 6 meses)    │ (crítico/alerta/info) │
│  avatar         │                       ├─────────────────────── │
│                 │  Tabela Movimentações │ Itens Críticos        │
│                 │  (entrada/saída)      │ (progress bar)        │
└─────────────────────────────────────────────────────────────────┘
```

### Grid CSS principal

```
main-grid: grid-template-columns: 1fr 1fr 260px;
kpi-row:   grid-template-columns: repeat(4, 1fr) 88px;
```

---

## 5. Componentes

### 5.1 Sidebar (`<AppSidebar>`)

- **Largura:** 52px (icon-only, sem labels)
- **Implementação:** `<SidebarProvider><Sidebar>` do shadcn/ui (nunca `<div className="w-64 fixed">`)
- **Itens de navegação** (Lucide icons): Dashboard, Produtos, Movimentações, Compras, Relatórios, Fornecedores, Configurações
- **Estado ativo:** `bg-blue-950/40 text-blue-400` no item atual
- **Seletor de almoxarifado:** botão fixo no rodapé da sidebar, abre `<Popover>` com lista de almoxarifados da organização
- **Avatar do usuário:** iniciais do nome, abre menu de perfil/logout

### 5.2 Topbar (`<DashboardHeader>`)

- Título "Dashboard" + breadcrumb "Visão Geral"
- `<WarehouseSelector>`: `<Select>` com ponto verde animado (online) — filtra todos os dados da página
- Ícone de notificações com badge vermelho (contagem de alertas críticos não lidos)
- Avatar do usuário (duplicado do sidebar para contexto)

### 5.3 KPI Cards (`<KpiCard>`)

Quatro cards + um card de donut (5º slot):

| Card | Valor | Delta | Ícone semântico |
|------|-------|-------|-----------------|
| Valor em estoque | `R$ 42.830,00` | `↑ +12,4% vs mês anterior` | `DollarSign` |
| Itens cadastrados | `247` | `↑ +8 este mês` | `Package` |
| Abaixo do mínimo | `14` | `↓ +3 vs semana passada` | `AlertTriangle` (vermelho) |
| Saídas hoje | `38` | `— mesmo nível de ontem` | `ArrowLeftRight` |

- Valor em **Fira Code 20px bold**
- Delta com seta colorida: `↑` verde, `↓` vermelho, `—` muted
- Hover: `border-slate-600` (sem scale)
- 5º slot: `<DonutMini>` — SVG de categorias (Limpeza 42%, Copa 28%, EPI 18%, Outros 12%)

### 5.4 Gráfico de Barras — Consumo Mensal (`<MonthlyConsumptionChart>`)

- **Biblioteca:** Recharts `<BarChart>`
- **Dados:** 6 meses anteriores, unidades consumidas
- **Cores:** barras azul `#3B82F6`; barra do mês atual destacada em verde `#22C55E`
- **Tooltip:** formatado pt-BR, fundo `#0D1117`, borda `#1E293B`
- **Eixos:** `stroke="#475569"`, `tick={{ fill: '#64748B', fontSize: 11 }}`
- **ResponsiveContainer:** `width="100%" height="100%"`

### 5.5 Gráfico Donut — Consumo por Categoria (`<CategoryDonutChart>`)

- **Biblioteca:** Recharts `<PieChart>` com `innerRadius` (donut)
- **Máx. 6 fatias** (agrupar "Outros" se necessário)
- **Cores:** paleta semântica + `#A855F7` + `#06B6D4` para categorias extras
- **Legenda:** lista abaixo com cor + nome + percentual
- Versão "mini" inline na KPI row; versão expandida disponível no modal/tooltip

### 5.6 Lista de Alertas (`<AlertList>`)

- Borda esquerda colorida por severidade: `border-l-2 border-red-500` (crítico), `border-amber-500` (alerta), `border-blue-500` (info)
- Background sutil: `bg-red-500/5`, `bg-amber-500/5`, `bg-blue-500/5`
- Ponto com glow OLED nos críticos: `shadow-[0_0_5px_theme(colors.red.500)]`
- Cada item mostra: nome do item, estoque atual vs. mínimo, timestamp relativo
- Scroll interno se > 6 itens; scroll `overflow-y: auto` com scrollbar fina customizada
- Clique abre drawer lateral com detalhes do item

### 5.7 Lista de Itens Críticos (`<CriticalItemsList>`)

- Progress bar horizontal: `saldo / estoqueMinimo × 100%`
- Cor da barra: vermelho se < 25%, âmbar se 25–50%, verde se > 50%
- Glow sutil na barra vermelha: `shadow-[0_0_4px_theme(colors.red.500)]`
- Valor numérico à direita em Fira Code colorido
- Máx. 5 itens visíveis; link "Ver todos →" abre página `/produtos?filtro=critico`

### 5.8 Tabela de Movimentações (`<MovementsTable>`)

- Implementada com `<Table><TableHeader><TableBody><TableRow>` do shadcn/ui (nunca div-grid)
- Badge de tipo: `↑ Entrada` (verde), `↓ Saída` (vermelho), `⟳ Ajuste` (azul)
- Quantidade: Fira Code, `text-green-400` para positivo, `text-red-400` para negativo
- Colunas: Tipo · Item · Qtd · Hora · Usuário
- Hora em formato `HH:mm` (sem data, já que é "Hoje")
- Hover row: `hover:bg-slate-900`
- Link "Ver todas →" leva para `/movimentacoes`

---

## 6. Comportamento e Estados

### 6.1 Loading

- Cada seção tem skeleton independente (`<Skeleton>` do shadcn/ui)
- KPI cards: retângulo arredondado pulsando
- Gráficos: área inteira com skeleton
- Tabela: 5 linhas skeleton

### 6.2 Dados Vazios

- KPIs zerados: valor `—` em muted, sem delta
- Gráfico vazio: placeholder "Nenhum consumo registrado neste período"
- Tabela vazia: ilustração SVG + "Nenhuma movimentação hoje"
- Alertas vazios: checkmark verde + "Tudo em ordem"

### 6.3 Erros

- Toast de erro (`<Sonner>`) com ícone vermelho
- Botão "Tentar novamente" inline em cada card

### 6.4 Real-time

- Polling a cada 30s via TanStack Query (`refetchInterval: 30_000`)
- Badge "ao vivo" piscando verde no topbar quando polling ativo
- Movimentações novas entram com animação `slide-in-from-top` sutil

---

## 7. Dados (Mock → API)

Fase MVP: dados mockados como `const` TypeScript tipado. Estrutura compatível com o schema Prisma do CLAUDE.md §3.4.

```typescript
// tipos principais usados no dashboard
interface KpiData {
  valorEstoque: number;        // R$
  itensCadastrados: number;
  itensAbaixoMinimo: number;
  saidasHoje: number;
  deltas: Record<string, { value: number; direction: 'up' | 'down' | 'neutral' }>;
}

interface MovementRow {
  id: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  itemNome: string;
  quantidade: number;          // negativo para saída
  unidade: string;
  hora: string;                // HH:mm pt-BR
  usuario: string;
}

interface AlertItem {
  id: string;
  severidade: 'CRITICO' | 'ALERTA' | 'INFO';
  mensagem: string;
  meta: string;                // ex: "Estoque: 0 un · Mín: 20"
}

interface CriticalItem {
  id: string;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  unidade: string;
}
```

---

## 8. Estrutura de Arquivos

```
app/
  (dashboard)/
    page.tsx                   ← Dashboard page (RSC)
    loading.tsx                ← Skeleton global

components/
  dashboard/
    AppSidebar.tsx
    DashboardHeader.tsx
    KpiCard.tsx
    DonutMini.tsx
    MonthlyConsumptionChart.tsx
    CategoryDonutChart.tsx
    AlertList.tsx
    CriticalItemsList.tsx
    MovementsTable.tsx
    WarehouseSelector.tsx

lib/
  mock-data/
    dashboard.ts               ← dados de exemplo tipados

types/
  dashboard.ts                 ← interfaces acima
```

---

## 9. Pré-checagem UI (ui-ux-pro-max checklist)

- [x] Nenhum emoji como ícone — todos os ícones são Lucide React SVG
- [x] `cursor-pointer` em todos os elementos clicáveis (cards KPI, alertas, nav icons)
- [x] Hover com `transition-colors duration-200` — sem scale em cards
- [x] Contraste texto: `#F1F5F9` / `#000` = 16:1 ✓ · `#64748B` / `#000` = 5,9:1 ✓
- [x] Focus states visíveis para navegação por teclado (`focus-visible:ring-2 ring-blue-500`)
- [x] `prefers-reduced-motion` — animações desativadas com `motion-reduce:` prefixo
- [x] Responsivo: sidebar colapsa em < 1024px; KPIs em 2×2 em < 768px
- [x] Sem scroll horizontal em nenhum breakpoint
- [x] Números financeiros sempre em Fira Code
- [x] Locale pt-BR em 100% dos valores (moeda, datas, vírgula decimal)
- [x] shadcn `<Table>` e `<Sidebar>` usados corretamente (nunca div-grid manual)
- [x] `<SidebarProvider>` no layout pai antes de `<Sidebar>`
- [x] Conteúdo não escondido atrás da topbar fixa (padding-top correto)
