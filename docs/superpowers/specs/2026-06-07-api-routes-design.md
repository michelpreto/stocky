# AlmoxControl — API Routes · Design Spec

**Data:** 2026-06-07  
**Status:** Aprovado  
**Fase do produto:** MVP (v0.1)  
**Referência:** `almoxcontrol-CLAUDE.md` §2.1, §2.3  
**Subsistema:** 3 de 3 (Fundação BD → Auth → **API Routes**)  
**Pré-condição:** Subsistemas 1 e 2 implementados — Prisma client + sessão JWT disponível

---

## 1. Objetivo

Substituir todos os `lib/mock-data/*.ts` por Route Handlers reais que consultam o PostgreSQL. Ao final, o dashboard, o módulo de produtos e o fluxo de baixa do operador exibem dados reais do banco para o usuário autenticado.

---

## 2. Princípio de multi-tenancy nas queries

Todo Route Handler extrai `organizationId` da sessão e filtra TODAS as queries por ele:

```typescript
const session = await auth()
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const { organizationId } = session.user

// Toda query inclui: where: { organizationId }
const products = await db.product.findMany({ where: { organizationId } })
```

Isso garante isolamento total de dados entre organizações.

---

## 3. Endpoints do MVP

### 3.1 Dashboard

| Método | Rota | Retorna |
|--------|------|---------|
| GET | `/api/dashboard/kpis` | `KpiData` — valor em estoque, itens, abaixo do mínimo, saídas hoje |
| GET | `/api/dashboard/movements` | `MovementRow[]` — últimas 10 movimentações do dia |
| GET | `/api/dashboard/alerts` | `AlertItem[]` — itens abaixo do mínimo por severidade |
| GET | `/api/dashboard/critical-items` | `CriticalItem[]` — top 5 itens mais críticos |
| GET | `/api/dashboard/monthly-consumption` | `MonthlyData[]` — consumo dos últimos 6 meses |

### 3.2 Produtos

| Método | Rota | Retorna |
|--------|------|---------|
| GET | `/api/produtos` | `ProductWithWarehouse[]` — lista completa com filtros via query string |
| POST | `/api/produtos` | Cria produto + ProductWarehouse inicial |
| PATCH | `/api/produtos/[id]` | Atualiza produto |
| GET | `/api/produtos/[id]` | Produto individual com warehouse |

### 3.3 Movimentações (baixa do operador)

| Método | Rota | Retorna |
|--------|------|---------|
| GET | `/api/produtos/search` | `Product[]` — busca por nome/código/barras (param: `q`) |
| POST | `/api/movimentacoes` | Registra entrada/saída, atualiza `ProductWarehouse.estoqueAtual` |

---

## 4. Implementação dos Route Handlers

### Padrão de resposta

```typescript
// Sucesso
return NextResponse.json(data)

// Erro de autenticação
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// Erro de validação
return NextResponse.json({ error: 'Invalid payload', details: issues }, { status: 400 })

// Not found
return NextResponse.json({ error: 'Not found' }, { status: 404 })

// Erro interno
return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
```

### `/api/dashboard/kpis` — exemplo completo

```typescript
// app/api/dashboard/kpis/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const [products, todayMovements] = await Promise.all([
    db.productWarehouse.findMany({
      where: { product: { organizationId } },
      include: { product: { select: { custoUnitario: true } } },
    }),
    db.stockMovement.findMany({
      where: {
        organizationId,
        tipo: 'SAIDA',
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ])

  const valorEstoque = products.reduce((acc, pw) =>
    acc + pw.estoqueAtual * Number(pw.product.custoUnitario ?? 0), 0)

  const itensCadastrados = await db.product.count({ where: { organizationId, ativo: true } })

  const itensAbaixoMinimo = products.filter(
    (pw) => pw.estoqueAtual < pw.estoqueMinimo
  ).length

  return NextResponse.json({
    valorEstoque,
    itensCadastrados,
    itensAbaixoMinimo,
    saidasHoje: todayMovements.length,
    deltas: {
      valorEstoque:      { value: 0, direction: 'neutral' },
      itensCadastrados:  { value: 0, direction: 'neutral' },
      itensAbaixoMinimo: { value: 0, direction: 'neutral' },
      saidasHoje:        { value: 0, direction: 'neutral' },
    },
  })
}
```

> Deltas vs mês anterior são calculados em v0.2 quando houver histórico suficiente. MVP retorna `neutral`.

### `/api/movimentacoes` — transação atômica

```typescript
// app/api/movimentacoes/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  productId:   z.string().cuid(),
  warehouseId: z.string().cuid(),
  tipo:        z.enum(['ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA']),
  quantidade:  z.number().positive(),
  observacao:  z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid', details: parsed.error.issues }, { status: 400 })
  }

  const { productId, warehouseId, tipo, quantidade, observacao } = parsed.data
  const { organizationId, id: userId } = session.user

  const movement = await db.$transaction(async (tx) => {
    const pw = await tx.productWarehouse.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    })
    if (!pw) throw new Error('ProductWarehouse not found')

    const delta = tipo === 'SAIDA' ? -quantidade : quantidade
    const novoEstoque = pw.estoqueAtual + delta

    if (tipo === 'SAIDA' && novoEstoque < 0) {
      throw new Error('Estoque insuficiente')
    }

    await tx.productWarehouse.update({
      where: { productId_warehouseId: { productId, warehouseId } },
      data:  { estoqueAtual: novoEstoque },
    })

    return tx.stockMovement.create({
      data: {
        tipo, quantidade: delta, estoqueAntes: pw.estoqueAtual,
        estoqueDepois: novoEstoque, observacao,
        productId, warehouseId, userId, organizationId,
      },
    })
  })

  return NextResponse.json(movement, { status: 201 })
}
```

---

## 5. Integração com os componentes existentes

Os componentes do dashboard e produtos continuam iguais — apenas a fonte de dados muda. O padrão de substituição em cada página:

```typescript
// ANTES (mock):
import { mockKpi } from '@/lib/mock-data/dashboard'

// DEPOIS (API):
const res = await fetch('/api/dashboard/kpis')
const kpi = await res.json()
```

Para Server Components, usar `fetch` com `cache: 'no-store'` (dados em tempo real):

```typescript
// app/(dashboard)/page.tsx — torna-se RSC puro novamente
const kpi = await fetch(`${process.env.NEXTAUTH_URL}/api/dashboard/kpis`, {
  cache: 'no-store',
  headers: { cookie: cookies().toString() },
}).then(r => r.json())
```

Para Client Components (ProductsPage), usar `useEffect` + `fetch` ou SWR.

---

## 6. Estrutura de arquivos

```
app/
  api/
    dashboard/
      kpis/route.ts
      movements/route.ts
      alerts/route.ts
      critical-items/route.ts
      monthly-consumption/route.ts
    produtos/
      route.ts              ← GET (listagem) + POST (criar)
      [id]/route.ts         ← GET + PATCH
      search/route.ts       ← GET ?q=termo
    movimentacoes/
      route.ts              ← POST (criar movimentação)
```

---

## 7. Busca de produtos (operador)

`/api/produtos/search?q=alcool&warehouseId=xyz`

```typescript
const products = await db.product.findMany({
  where: {
    organizationId,
    ativo: true,
    OR: [
      { nome:          { contains: q, mode: 'insensitive' } },
      { codigoInterno: { contains: q, mode: 'insensitive' } },
      { codigoBarras:  { equals:   q } },
    ],
  },
  include: {
    productWarehouses: { where: { warehouseId } },
    category: true,
  },
  take: 20,
})
```

---

## 8. Testes

```typescript
// __tests__/api/movimentacoes.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('POST /api/movimentacoes', () => {
  it('retorna 401 sem sessão')
  it('retorna 400 com payload inválido (quantidade negativa)')
  it('retorna 400 com estoque insuficiente para SAIDA')
  it('cria movimento e atualiza estoqueAtual atomicamente')
  it('retorna 201 com movimento criado')
})
```

> Os testes de Route Handlers usam mocks do Prisma client e do `auth()`. Não hit real no banco.

---

## 9. Ordem de implementação

1. `/api/produtos` (GET + POST) — base para o módulo de produtos já construído
2. `/api/dashboard/*` (5 endpoints) — dados reais no dashboard
3. `/api/movimentacoes` (POST) — baixa real do operador
4. `/api/produtos/search` (GET) — busca do operador
5. `/api/produtos/[id]` (GET + PATCH) — edição no ProductSheet

---

## 10. Resumo dos 3 subsistemas

| Subsistema | Entrega | Pré-condição |
|---|---|---|
| 1 — Fundação BD | Schema + migrations + seed | — |
| 2 — Auth | Login + middleware + sessão JWT | Subsistema 1 |
| 3 — API Routes | 9 endpoints REST + integração nas telas | Subsistemas 1 + 2 |
