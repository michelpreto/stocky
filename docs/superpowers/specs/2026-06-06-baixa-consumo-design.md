# AlmoxControl — Tela de Baixa de Consumo (Operador) · Design Spec

**Data:** 2026-06-06
**Status:** Aprovado
**Fase do produto:** v0.2 — "Operação rápida"
**Referência:** `almoxcontrol-CLAUDE.md` §2.4, §3.1, §4.2, RNF-02, RNF-03, RNF-04

---

## 1. Objetivo

Construir a tela de baixa rápida do operador — a tela mais usada do AlmoxControl. O operador pega o item, busca pelo nome/código/barras, informa quantidade e setor, e confirma. O fluxo inteiro deve completar em menos de 10 segundos (meta CLAUDE.md). A tela funciona offline e dá feedback sonoro + visual em cada baixa.

---

## 2. Decisões de Arquitetura

### 2.1 Shell dedicado

Rota `/baixa` com layout próprio — sem a sidebar do dashboard. Alinha com CLAUDE.md §4.2: "Operador abre direto na tela de baixa rápida, com o campo de busca em foco." O shell tem apenas: logo + título + avatar do usuário.

### 2.2 Scanner de código de barras

Opção B aprovada: `<input type="file" capture="environment" accept="image/*">` acionado pelo botão de câmera. O SO do celular lida com o reconhecimento da imagem. O campo de busca também captura naturalmente leitores USB/Bluetooth (emitem como teclado).

### 2.3 Persistência offline

Baixas registradas offline são salvas em `localStorage` como fila JSON. Ao reconectar, a fila é drenada via `navigator.onLine` + `window.addEventListener('online', sync)`. O catálogo de produtos é mantido em cache (IndexedDB — Dexie) para busca offline. O estoque offline exibe `~` para indicar dado aproximado.

### 2.4 Desfazer (undo)

Cada baixa fica na fila de "últimas baixas" por 60 segundos. Durante esse período, o botão "Desfazer" reverte a operação localmente (remove da fila de sync) ou faz POST para `/api/movements/{id}/undo` se já sincronizada. O countdown é visual (texto "Desfazer 43s") e controlado por `setTimeout`.

---

## 3. Design System (override para operador)

Herda todos os tokens OLED dark do dashboard (`globals.css`). Overrides específicos desta tela:

| Token | Valor | Uso |
|-------|-------|-----|
| `--search-focus-ring` | `#3B82F620` (3px) | Campo de busca em foco |
| `--offline-border` | `#F59E0B40` | Borda do campo em modo offline |
| `--confirm-glow` | `#22C55E40` | Box-shadow do botão confirmar |

### 3.1 Alvos de toque (com luvas)

| Elemento | Altura mínima |
|----------|---------------|
| Botão "Confirmar Baixa" | **56px** |
| Botão "Cancelar" | **48px** |
| Controles ± quantidade | **44px** |
| Atalhos de quantidade (1 / 5 / 10) | **44px** |
| Campo de busca | **48px** |
| Botão câmera | **44×44px** |
| Itens da lista de resultados | **48px** |
| Botão "Desfazer" | **44px** |

Gap mínimo entre alvos adjacentes: **8px**.

### 3.2 Tipografia operacional

- Quantidade: `font-mono text-3xl font-black` — máxima legibilidade com luvas
- Estoque atual: `font-mono text-2xl font-bold` — destaque no modal
- Nomes de produto: `font-semibold text-sm` — compacto mas legível
- Metadados: `text-xs text-muted-foreground`

### 3.3 Anti-padrões proibidos nesta tela

- `input type="number"` sem `inputMode="numeric"` — abre teclado errado no iOS
- Botões menores que 44px — inacessíveis com luvas
- Hover sem `transition-colors` — feedback ausente
- Scroll horizontal — inacessível no mobile
- Cores como único indicador de estado (sem texto/ícone)
- Animações de confirmação sem respeitar `prefers-reduced-motion`
- Estoque offline sem indicador `~` de aproximação

---

## 4. Rota e Layout

```
app/
  (operator)/
    layout.tsx          ← OperatorShell: logo + título + avatar, sem sidebar
    baixa/
      page.tsx          ← BaixaPage (RSC shell, passa dados p/ Client Components)
      loading.tsx       ← Skeleton do campo de busca
```

### 4.1 OperatorShell

Server Component. Layout mínimo:
```
┌──────────────────────────────────┐
│  [A]  Baixa Rápida      [Avatar] │  ← top bar 44px
├──────────────────────────────────┤
│  [!] Offline — sync pendente...  │  ← banner condicional
├──────────────────────────────────┤
│  [  Buscar item ou código...  ][📷]│  ← 48px, autoFocus
├──────────────────────────────────┤
│  Resultados (autocomplete)       │
│  ─────────────────────           │
│  Últimas baixas hoje             │
└──────────────────────────────────┘
```

---

## 5. Componentes

### 5.1 `SearchField`
**Client Component**

- `<input>` com `autoFocus`, `inputMode="search"`, `autoComplete="off"`, `autoCorrect="off"`, `autoCapitalize="off"`, `spellCheck={false}`
- `style={{ touchAction: 'manipulation' }}`
- Debounce de 150ms no onChange para disparar busca
- Estado: `query: string`, `results: SearchResult[]`, `isLoading: boolean`
- Ao pressionar Enter ou selecionar resultado → abre `BaixaModal`

```typescript
interface SearchResult {
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
```

### 5.2 `CameraButton`
**Client Component**

- `<label>` com `htmlFor` linkado a `<input type="file" capture="environment" accept="image/*" className="sr-only">`
- Ao selecionar arquivo: tenta extrair texto do nome do arquivo (fallback: preenche query com nome)
- `aria-label="Escanear código de barras"`
- Tamanho: 44×44px

### 5.3 `SearchResultList`
**Client Component**

- Lista de `SearchResult[]` — máximo 5 itens visíveis antes de scroll
- Cada item: nome + código + categoria + estoque atual (colorido por criticidade)
- Estoque crítico (< mínimo): `text-danger`; warning (< 150% do mínimo): `text-warning`; ok: `text-success`
- Clique → abre `BaixaModal` com o item selecionado
- Estado vazio com query: "Nenhum item encontrado — tente o código completo"
- Estado offline: busca no cache local (Dexie)

### 5.4 `BaixaModal`
**Client Component** — `role="dialog"` + `aria-modal="true"` + focus trap

Props: `item: SearchResult | null`, `onClose: () => void`, `onConfirm: (baixa: BaixaInput) => void`

```typescript
interface BaixaInput {
  produtoId: string
  quantidade: number
  unidade: string
  setorId: string
  motivo: MotivoType
  observacao?: string
}

type MotivoType = 'CONSUMO_ROTINEIRO' | 'QUEBRA' | 'VENCIMENTO' | 'OUTRO'
```

**Seções do modal (de cima para baixo):**
1. Handle + produto (foto 44×44, nome, código, badge de estoque)
2. Estoque atual em destaque (`font-mono text-2xl`)
3. Controle de quantidade: `[−]` `[valor]` `[+]` + atalhos `[1]` `[5]` `[10]`
4. Setor solicitante (`<select>`) — ordena pelos mais usados pelo operador
5. Motivo (`<select>`) — padrão: "Consumo rotineiro"
6. Observação (`<textarea>` colapsável, opcional)
7. `[Cancelar]` `[✓ Confirmar Baixa]`

**Validações:**
- Quantidade > 0
- Quantidade ≤ estoqueAtual (bloqueia com mensagem "Estoque insuficiente — disponível: N")
- Setor obrigatório

**`inputMode="numeric"` no campo de quantidade interno** (para teclado numérico no mobile).

### 5.5 `ConfirmationScreen`
**Client Component**

- Ocupa a tela inteira por 2 segundos após confirmação
- Ícone ✓ verde com glow (`box-shadow: 0 0 24px #22C55E60`)
- Card com: item, quantidade (−N un), setor, saldo restante
- `navigator.vibrate([100, 50, 100])` — vibração dupla (com fallback silencioso)
- `aria-live="polite"` anuncia "Baixa registrada: [item], [quantidade]"
- `prefers-reduced-motion`: desativa animação de entrada do ícone, mantém o card
- Após 2s: `onComplete()` → limpa query, foca o campo de busca

### 5.6 `RecentList`
**Client Component**

- Lista as últimas baixas do dia (máximo 10, do mais recente ao mais antigo)
- Cada item: nome + quantidade + hora (`HH:mm`) + botão "Desfazer" (60s)
- Countdown: `useEffect` com `setInterval(1000)`, exibe "Desfazer 43s"
- Após 60s: botão some (apenas exibe o histórico)
- Desfazer: chama `undoBaixa(id)` → remove da lista local + cancela sync (se offline) ou POST `/api/movements/{id}/undo` (se online)

### 5.7 `OfflineBanner`
**Client Component**

- `useEffect` + `window.addEventListener('online'/'offline')`
- Aparece abaixo do top bar quando `!navigator.onLine`
- Exibe contagem de baixas pendentes de sync
- Borda do campo de busca muda de `#3B82F6` para `#F59E0B` offline
- Estoque nos resultados exibe `~N` (tilde = aproximado)

---

## 6. Fluxo completo de dados

```
[Operador digita] → SearchField.onChange (debounce 150ms)
  → GET /api/products/search?q=... (online)
  → Dexie.products.search(q) (offline)
  → SearchResultList renderiza

[Operador toca no item] → BaixaModal.open(item)
  → Operador preenche qtd + setor + motivo
  → [Confirmar] → BaixaModal.onConfirm(BaixaInput)
    → POST /api/movements (online) | enqueue localStorage (offline)
    → ConfirmationScreen.show() [2s]
    → RecentList.prepend(novaMovimentação)
    → SearchField.focus() + clear()

[Desfazer] → undoBaixa(id)
  → DELETE /api/movements/{id} (online)
  → dequeue localStorage (offline)
  → RecentList.remove(id)
```

---

## 7. Tipos novos (`types/operator.ts`)

```typescript
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
  hora: string           // "HH:mm"
  expiresAt: number      // Date.now() + 60_000
  synced: boolean
}

export interface Setor {
  id: string
  nome: string
  usageCount: number     // para ordenação dos mais usados
}
```

---

## 8. Mock data (`lib/mock-data/operator.ts`)

```typescript
export const mockSearchResults: SearchResult[] = [
  { id: 'p1', nome: 'Álcool 70% 1L Talge', codigoInterno: '00034', categoria: 'Limpeza', unidade: 'un', estoqueAtual: 8,  estoqueMinimo: 20 },
  { id: 'p2', nome: 'Álcool Gel 70% 500g', codigoInterno: '00035', categoria: 'Limpeza', unidade: 'un', estoqueAtual: 3,  estoqueMinimo: 10 },
  { id: 'p3', nome: 'Detergente 500ml',    codigoInterno: '00041', categoria: 'Limpeza', unidade: 'un', estoqueAtual: 12, estoqueMinimo: 15 },
]

export const mockSetores: Setor[] = [
  { id: 's1', nome: 'Copa / Limpeza', usageCount: 48 },
  { id: 's2', nome: 'Recepção',       usageCount: 12 },
  { id: 's3', nome: 'Manutenção',     usageCount: 8  },
  { id: 's4', nome: 'Administrativo', usageCount: 5  },
]

export const mockRecentBaixas: RecentBaixa[] = [
  { id: 'b1', produtoNome: 'Luva Nitrílica P', quantidade: 2, unidade: 'cx',  hora: '14:22', expiresAt: Date.now() + 43_000, synced: true  },
  { id: 'b2', produtoNome: 'Papel Toalha PCT', quantidade: 6, unidade: 'pct', hora: '13:41', expiresAt: Date.now() - 1,      synced: true  },
]
```

---

## 9. Estrutura de arquivos

```
app/
  (operator)/
    layout.tsx                    ← OperatorShell (Server Component)
    baixa/
      page.tsx                    ← BaixaPage (RSC)
      loading.tsx                 ← skeleton

components/
  operator/
    SearchField.tsx               ← 'use client' — busca com debounce
    CameraButton.tsx              ← 'use client' — input file
    SearchResultList.tsx          ← 'use client' — lista de resultados
    BaixaModal.tsx                ← 'use client' — modal + focus trap
    QuantityControl.tsx           ← subcomponente ±  + atalhos
    ConfirmationScreen.tsx        ← 'use client' — card verde + vibração
    RecentList.tsx                ← 'use client' — últimas baixas + undo
    OfflineBanner.tsx             ← 'use client' — estado de rede

types/
  operator.ts                     ← interfaces acima

lib/
  mock-data/
    operator.ts                   ← dados de exemplo
  offline-queue.ts                ← enqueue/dequeue localStorage
```

---

## 10. Pré-checagem de acessibilidade

| Critério | Status | Detalhe |
|----------|--------|---------|
| Contraste texto principal | ✅ 16:1 | #F1F5F9 / #000 |
| Contraste success (#22C55E) | ✅ 8.9:1 | Passa AA |
| Contraste warning (#F59E0B) | ✅ 6.5:1 | Passa AA |
| Touch targets ≥ 44px | ✅ | Todos os controles |
| Gap ≥ 8px entre alvos | ✅ | `gap-2` mínimo |
| `inputMode="numeric"` | ✅ | Campo de quantidade |
| `touch-action: manipulation` | ✅ | Remove delay 300ms |
| `overscroll-behavior: contain` | ✅ | Evita pull-to-refresh |
| `autoFocus` no campo de busca | ✅ | Pronto para digitar |
| `role="dialog"` + `aria-modal` | ✅ | Modal acessível |
| Focus trap no modal | ✅ | Tab circula nos controles |
| `aria-label` no botão câmera | ✅ | "Escanear código de barras" |
| `aria-live="polite"` na confirmação | ✅ | Anuncia resultado |
| `prefers-reduced-motion` | ✅ | Desativa animação de entrada |
| Cor não é único indicador | ✅ | Texto + ícone sempre presentes |
| Vibração com fallback | ✅ | `try/catch` em `navigator.vibrate` |
| Offline: estoque com `~` | ✅ | Indica dado aproximado |
