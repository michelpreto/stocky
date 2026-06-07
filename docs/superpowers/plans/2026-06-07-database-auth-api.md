# AlmoxControl — Banco de Dados + Auth + API Routes · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **IMPORTANTE:** Este projeto usa Next.js 16.2.7 com APIs que podem diferir do seu treinamento. Leia `node_modules/next/dist/docs/` antes de escrever qualquer código. Heed deprecation notices.

**Goal:** Substituir todos os dados mockados por PostgreSQL real, com autenticação NextAuth.js JWT e 9 endpoints REST multi-tenant.

**Architecture:** Três subsistemas em sequência: (1) Prisma schema 7 models + seed via `lib/db.ts` singleton; (2) NextAuth.js Credentials + JWT + middleware de proteção + redirect por role; (3) Route Handlers REST que consultam o banco com `organizationId` da sessão em cada query. As telas existentes (dashboard, produtos, baixa) são atualizadas para consumir os endpoints.

**Tech Stack:** Prisma ORM · PostgreSQL 16 · NextAuth.js v5 (next-auth@beta) · bcryptjs · tsx · Next.js 16 App Router · TypeScript · Vitest

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `prisma/schema.prisma` | Create | Schema com 7 models + 5 enums |
| `prisma/seed.ts` | Create | Seed: 1 org + 1 user + 1 warehouse + 5 cats + 7 produtos + 6 movimentações |
| `lib/db.ts` | Create | Prisma client singleton (padrão Next.js hot-reload safe) |
| `types/db.ts` | Create | Tipos compostos: `ProductWithWarehouse`, `MovementWithRelations` |
| `types/next-auth.d.ts` | Create | Extensão da sessão com `id`, `role`, `organizationId` |
| `auth.ts` | Create | NextAuth config: CredentialsProvider + JWT callbacks |
| `middleware.ts` | Create | Proteção de rotas + redirect por role após login |
| `app/login/page.tsx` | Create | Formulário de login (Client Component) |
| `app/api/auth/[...nextauth]/route.ts` | Create | GET + POST handlers do NextAuth |
| `app/api/dashboard/kpis/route.ts` | Create | KPIs: valor em estoque, itens, alertas, saídas hoje |
| `app/api/dashboard/movements/route.ts` | Create | Últimas 10 movimentações do dia |
| `app/api/dashboard/alerts/route.ts` | Create | Alertas por severidade (crítico/alerta/info) |
| `app/api/dashboard/critical-items/route.ts` | Create | Top 5 itens mais críticos |
| `app/api/dashboard/monthly-consumption/route.ts` | Create | Consumo mensal dos últimos 6 meses |
| `app/api/produtos/route.ts` | Create | GET (listagem com filtros) + POST (criar produto) |
| `app/api/produtos/[id]/route.ts` | Create | GET (individual) + PATCH (atualizar) |
| `app/api/produtos/search/route.ts` | Create | GET ?q= (busca para operador) |
| `app/api/movimentacoes/route.ts` | Create | POST (registrar entrada/saída — transação atômica) |
| `app/(dashboard)/page.tsx` | Modify | Substituir mock data por fetch de `/api/dashboard/*` |
| `app/(dashboard)/produtos/page.tsx` | Modify | Substituir mock data por fetch de `/api/produtos` |
| `app/(dashboard)/layout.tsx` | Modify | Verificar sessão + redirecionar para login se ausente |
| `app/(operator)/layout.tsx` | Modify | Verificar sessão + redirecionar para login se ausente |
| `app/(operator)/baixa/page.tsx` | Modify | Usar `/api/produtos/search` e `/api/movimentacoes` |
| `__tests__/lib/db-seed.test.ts` | Create | Testes de funções puras do seed (hash + slug) |
| `__tests__/api/movimentacoes.test.ts` | Create | Testes do endpoint de movimentação |

---

## Task 1: Instalar dependências + prisma init

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar dependências de produção**

```bash
npm install @prisma/client bcryptjs next-auth@beta
```

Esperado: sem erros. `package.json` atualizado com as 3 novas dependências.

- [ ] **Step 2: Instalar dependências de desenvolvimento**

```bash
npm install -D prisma @types/bcryptjs tsx
```

Esperado: sem erros.

- [ ] **Step 3: Inicializar Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Esperado: criação de `prisma/schema.prisma` e adição de `DATABASE_URL` no `.env`.

- [ ] **Step 4: Adicionar script de seed ao `package.json`**

Abra `package.json` e adicione dentro do objeto raiz (após `"scripts"`):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

O `package.json` final deve ter:

```json
{
  "name": "almoxcontrol",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros (Prisma client ainda não foi gerado, então imports de `@prisma/client` falharão — isso é esperado neste step).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json prisma/ .env
git commit -m "chore: install Prisma, bcryptjs, next-auth@beta, tsx"
```

---

## Task 2: Escrever schema Prisma

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Substituir conteúdo de `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  OPERATOR
  SOLICITANTE
}

enum TipoEmbalagem {
  FARDO
  GALAO
  CAIXA
  PACOTE
  PAR
  UNIDADE
  ROLO
  SACO
  BISNAGA
  FRASCO
}

enum UnidadeConsumo {
  UN
  KG
  G
  L
  ML
  M
  CM
  PAR
  CX
}

enum ControlarPor {
  EMBALAGEM
  CONSUMO
}

enum MovementType {
  ENTRADA
  SAIDA
  AJUSTE
  TRANSFERENCIA
}

model Organization {
  id        String   @id @default(cuid())
  nome      String
  slug      String   @unique
  logo      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users      User[]
  warehouses Warehouse[]
  categories Category[]
  products   Product[]
  movements  StockMovement[]
}

model User {
  id             String   @id @default(cuid())
  nome           String
  email          String   @unique
  passwordHash   String
  role           UserRole @default(OPERATOR)
  ativo          Boolean  @default(true)
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization   @relation(fields: [organizationId], references: [id])
  movements    StockMovement[]
}

model Warehouse {
  id             String   @id @default(cuid())
  nome           String
  descricao      String?
  ativo          Boolean  @default(true)
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization      Organization       @relation(fields: [organizationId], references: [id])
  productWarehouses ProductWarehouse[]
  movements         StockMovement[]
}

model Category {
  id             String   @id @default(cuid())
  nome           String
  cor            String?
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  products     Product[]
}

model Product {
  id             String         @id @default(cuid())
  codigoInterno  String?
  nome           String
  codigoBarras   String?
  categoryId     String
  tipoEmbalagem  TipoEmbalagem
  unidadeConsumo UnidadeConsumo
  fatorEmbalagem Float          @default(1)
  controlarPor   ControlarPor   @default(EMBALAGEM)
  custoUnitario  Decimal?       @db.Decimal(12, 2)
  foto           String?
  fichaSeguranca String?
  ativo          Boolean        @default(true)
  organizationId String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  organization      Organization       @relation(fields: [organizationId], references: [id])
  category          Category           @relation(fields: [categoryId], references: [id])
  productWarehouses ProductWarehouse[]
  movements         StockMovement[]
}

model ProductWarehouse {
  productId      String
  warehouseId    String
  estoqueAtual   Float  @default(0)
  estoqueMinimo  Float  @default(0)
  estoqueMaximo  Float?
  pontoReposicao Float?
  localizacao    String?

  product   Product   @relation(fields: [productId], references: [id])
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])

  @@id([productId, warehouseId])
}

model StockMovement {
  id             String       @id @default(cuid())
  tipo           MovementType
  quantidade     Float
  estoqueAntes   Float
  estoqueDepois  Float
  observacao     String?
  productId      String
  warehouseId    String
  userId         String
  organizationId String
  createdAt      DateTime     @default(now())

  product      Product      @relation(fields: [productId], references: [id])
  warehouse    Warehouse    @relation(fields: [warehouseId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])
}
```

- [ ] **Step 2: Validar schema**

```bash
npx prisma validate
```

Esperado: `The schema at prisma/schema.prisma is valid.`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: Prisma schema — 7 models, 5 enums, multi-tenant"
```

---

## Task 3: PostgreSQL local + migration inicial

**Files:**
- Modify: `.env` (DATABASE_URL)

- [ ] **Step 1: Subir PostgreSQL local via Docker**

```bash
docker run -d --name almox-dev-postgres \
  -e POSTGRES_USER=almox \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=almoxcontrol \
  -p 5432:5432 \
  postgres:16-alpine
```

Esperado: container ID impresso sem erros.

- [ ] **Step 2: Aguardar postgres estar pronto**

```bash
docker exec almox-dev-postgres pg_isready -U almox
```

Repetir até retornar: `/var/run/postgresql:5432 - accepting connections`

- [ ] **Step 3: Configurar DATABASE_URL no `.env`**

Abra `.env` e atualize (ou adicione) a linha:

```env
DATABASE_URL="postgresql://almox:devpass@localhost:5432/almoxcontrol"
```

> `.env` já está no `.gitignore` — não será commitado.

- [ ] **Step 4: Gerar migration inicial**

```bash
npx prisma migrate dev --name init
```

Esperado:
```
✓ Generated Prisma Client
✓ Your database is now in sync with your schema.
```

Pasta `prisma/migrations/` criada com o SQL da migration.

- [ ] **Step 5: Verificar tabelas no banco**

```bash
docker exec almox-dev-postgres psql -U almox -d almoxcontrol -c "\dt"
```

Esperado: listagem com 6 tabelas: `Category`, `Organization`, `Product`, `ProductWarehouse`, `StockMovement`, `User`, `Warehouse`.

- [ ] **Step 6: Commit das migrations**

```bash
git add prisma/migrations/
git commit -m "feat: Prisma migration — init schema with 7 tables"
```

---

## Task 4: Prisma client singleton + tipos compostos (TDD)

**Files:**
- Create: `lib/db.ts`
- Create: `types/db.ts`
- Create: `__tests__/lib/db-seed.test.ts`

- [ ] **Step 1: Escrever testes das utilitárias do seed (TDD — falham primeiro)**

```typescript
// __tests__/lib/db-seed.test.ts
import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'

function toSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

describe('seed utilities', () => {
  it('gera hash de senha válido', async () => {
    const hash = await bcrypt.hash('Admin@2026', 12)
    expect(await bcrypt.compare('Admin@2026', hash)).toBe(true)
    expect(await bcrypt.compare('senha-errada', hash)).toBe(false)
  })

  it('rejeita senha incorreta', async () => {
    const hash = await bcrypt.hash('Admin@2026', 12)
    const result = await bcrypt.compare('errada', hash)
    expect(result).toBe(false)
  })

  it('gera slug a partir do nome da organização', () => {
    expect(toSlug('Minha Empresa')).toBe('minha-empresa')
    expect(toSlug('AlmoxControl')).toBe('almoxcontrol')
  })

  it('slug remove acentos', () => {
    expect(toSlug('Álcool & Cia')).toBe('alcool--cia')
  })
})
```

- [ ] **Step 2: Rodar — esperar verde (bcryptjs instalado)**

```bash
npx vitest run __tests__/lib/db-seed.test.ts
```

Esperado: `✓ 4 tests passed`

- [ ] **Step 3: Criar `lib/db.ts`**

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 4: Criar `types/db.ts`**

```typescript
// types/db.ts
import type {
  Product, ProductWarehouse, StockMovement,
  User, Category, Warehouse,
} from '@prisma/client'

export type ProductWithWarehouse = Product & {
  warehouse: ProductWarehouse | null
  category: Category
}

export type MovementWithRelations = StockMovement & {
  product:  Pick<Product,   'id' | 'nome' | 'unidadeConsumo'>
  user:     Pick<User,      'id' | 'nome'>
  warehouse: Pick<Warehouse, 'id' | 'nome'>
}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts types/db.ts __tests__/lib/db-seed.test.ts
git commit -m "feat: Prisma client singleton, composite types, seed utils tests (TDD)"
```

---

## Task 5: Seed

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Criar `prisma/seed.ts`**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

if (process.env.NODE_ENV === 'production' && !process.env.SEED_FORCE) {
  console.log('Seed ignorado em produção. Use SEED_FORCE=1 para forçar.')
  process.exit(0)
}

async function main() {
  console.log('Seeding...')

  // 1. Organization
  const org = await db.organization.upsert({
    where:  { slug: 'minha-empresa' },
    update: {},
    create: { nome: 'Minha Empresa', slug: 'minha-empresa' },
  })
  console.log('  ✓ Organization:', org.nome)

  // 2. Admin user
  const passwordHash = await bcrypt.hash('Admin@2026', 12)
  const admin = await db.user.upsert({
    where:  { email: 'michel@uol.com.br' },
    update: {},
    create: {
      nome: 'Michel', email: 'michel@uol.com.br',
      passwordHash, role: 'ADMIN', organizationId: org.id,
    },
  })
  console.log('  ✓ User:', admin.email)

  // 3. Warehouse
  const warehouse = await db.warehouse.upsert({
    where:  { id: 'warehouse-principal' },
    update: {},
    create: { id: 'warehouse-principal', nome: 'Almoxarifado Principal', organizationId: org.id },
  })
  console.log('  ✓ Warehouse:', warehouse.nome)

  // 4. Categories
  const categoryData = [
    { nome: 'Limpeza',      cor: '#3B82F6' },
    { nome: 'Copa',         cor: '#22C55E' },
    { nome: 'EPI',          cor: '#F59E0B' },
    { nome: 'Descartáveis', cor: '#A855F7' },
    { nome: 'Ferramentas',  cor: '#64748B' },
  ]
  const categories: Record<string, { id: string }> = {}
  for (const cat of categoryData) {
    const c = await db.category.upsert({
      where:  { id: `cat-${cat.nome.toLowerCase().replace(/[^a-z]/g, '')}` },
      update: {},
      create: { id: `cat-${cat.nome.toLowerCase().replace(/[^a-z]/g, '')}`, ...cat, organizationId: org.id },
    })
    categories[cat.nome] = c
    console.log('  ✓ Category:', c.nome)
  }

  // 5. Products + ProductWarehouses
  const products = [
    {
      id: 'prod-alcool', codigoInterno: '00034', nome: 'Álcool 70% 1L Talge',
      codigoBarras: '7891082036424', categoryNome: 'Limpeza',
      tipoEmbalagem: 'UNIDADE' as const, unidadeConsumo: 'UN' as const,
      fatorEmbalagem: 1, custoUnitario: 4.50,
      estoqueAtual: 8, estoqueMinimo: 20,
    },
    {
      id: 'prod-agua-sanitaria', codigoInterno: '00041', nome: 'Água Sanitária 5L Talge',
      categoryNome: 'Limpeza',
      tipoEmbalagem: 'GALAO' as const, unidadeConsumo: 'L' as const,
      fatorEmbalagem: 5, custoUnitario: 12.80,
      estoqueAtual: 2, estoqueMinimo: 8,
    },
    {
      id: 'prod-luva', codigoInterno: '00078', nome: 'Luva Nitrílica P',
      categoryNome: 'EPI',
      tipoEmbalagem: 'CAIXA' as const, unidadeConsumo: 'UN' as const,
      fatorEmbalagem: 100, custoUnitario: 89.00,
      estoqueAtual: 1, estoqueMinimo: 6,
    },
    {
      id: 'prod-papel', codigoInterno: '00092', nome: 'Papel Toalha PCT c/2',
      categoryNome: 'Limpeza',
      tipoEmbalagem: 'PACOTE' as const, unidadeConsumo: 'UN' as const,
      fatorEmbalagem: 2, custoUnitario: 6.20,
      estoqueAtual: 4, estoqueMinimo: 12,
    },
    {
      id: 'prod-esponja', nome: 'Esponja de Aço',
      categoryNome: 'Limpeza', ativo: false,
      tipoEmbalagem: 'UNIDADE' as const, unidadeConsumo: 'UN' as const,
      fatorEmbalagem: 1,
      estoqueAtual: 0, estoqueMinimo: 0,
    },
    {
      id: 'prod-detergente', codigoInterno: '00015', nome: 'Detergente 500ml',
      categoryNome: 'Limpeza',
      tipoEmbalagem: 'UNIDADE' as const, unidadeConsumo: 'ML' as const,
      fatorEmbalagem: 500, custoUnitario: 2.90,
      estoqueAtual: 12, estoqueMinimo: 15,
    },
    {
      id: 'prod-sabao', codigoInterno: '00023', nome: 'Sabão em Pó 1kg',
      categoryNome: 'Limpeza',
      tipoEmbalagem: 'FARDO' as const, unidadeConsumo: 'KG' as const,
      fatorEmbalagem: 10, custoUnitario: 8.50,
      estoqueAtual: 25, estoqueMinimo: 10,
    },
  ]

  for (const p of products) {
    const { estoqueAtual, estoqueMinimo, categoryNome, ativo = true, ...productData } = p
    const categoryId = categories[categoryNome].id

    const product = await db.product.upsert({
      where:  { id: p.id },
      update: {},
      create: { ...productData, categoryId, organizationId: org.id, ativo },
    })

    if (estoqueAtual !== undefined) {
      await db.productWarehouse.upsert({
        where:  { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
        update: {},
        create: { productId: product.id, warehouseId: warehouse.id, estoqueAtual, estoqueMinimo },
      })
    }
    console.log('  ✓ Product:', product.nome)
  }

  // 6. Sample StockMovements (últimas movimentações do dashboard)
  const today = new Date()
  const movements = [
    { productId: 'prod-alcool',       tipo: 'SAIDA'   as const, quantidade: -4,  desc: 'Baixa de consumo' },
    { productId: 'prod-detergente',   tipo: 'ENTRADA' as const, quantidade: 24,  desc: 'Recebimento' },
    { productId: 'prod-papel',        tipo: 'SAIDA'   as const, quantidade: -6,  desc: 'Baixa de consumo' },
    { productId: 'prod-luva',         tipo: 'SAIDA'   as const, quantidade: -2,  desc: 'Baixa de consumo' },
    { productId: 'prod-agua-sanitaria', tipo: 'AJUSTE' as const, quantidade: -1, desc: 'Ajuste de inventário' },
    { productId: 'prod-sabao',        tipo: 'ENTRADA' as const, quantidade: 12,  desc: 'Recebimento fardo' },
  ]

  for (const m of movements) {
    const pw = await db.productWarehouse.findUnique({
      where: { productId_warehouseId: { productId: m.productId, warehouseId: warehouse.id } },
    })
    if (!pw) continue

    await db.stockMovement.create({
      data: {
        tipo: m.tipo,
        quantidade: m.quantidade,
        estoqueAntes: pw.estoqueAtual,
        estoqueDepois: pw.estoqueAtual + m.quantidade,
        observacao: m.desc,
        productId: m.productId,
        warehouseId: warehouse.id,
        userId: admin.id,
        organizationId: org.id,
        createdAt: new Date(today.getTime() - Math.random() * 6 * 60 * 60 * 1000),
      },
    })
  }
  console.log('  ✓ StockMovements: 6 created')

  console.log('\nSeed concluído.')
  console.log('Login: michel@uol.com.br / Admin@2026')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
```

- [ ] **Step 2: Rodar seed**

```bash
npx prisma db seed
```

Esperado:
```
Seeding...
  ✓ Organization: Minha Empresa
  ✓ User: michel@uol.com.br
  ✓ Warehouse: Almoxarifado Principal
  ✓ Category: Limpeza
  ...
  ✓ StockMovements: 6 created
Seed concluído.
Login: michel@uol.com.br / Admin@2026
```

- [ ] **Step 3: Verificar dados no Prisma Studio**

```bash
npx prisma studio
```

Abrir `http://localhost:5555`. Verificar:
- `Organization`: 1 registro
- `User`: 1 registro com email `michel@uol.com.br`
- `Product`: 7 registros
- `ProductWarehouse`: 7 registros
- `StockMovement`: 6 registros

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: Prisma seed — 1 org + 1 user + 1 warehouse + 5 cats + 7 produtos + 6 movements"
```

---

## Task 6: NextAuth — configuração + route handler

**Files:**
- Create: `auth.ts`
- Create: `types/next-auth.d.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Criar `types/next-auth.d.ts`**

```typescript
// types/next-auth.d.ts
import type { DefaultSession } from 'next-auth'
import type { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: UserRole
      organizationId: string
    }
  }
}
```

- [ ] **Step 2: Criar `auth.ts`** na raiz do projeto

```typescript
// auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user || !user.ativo) return null

        const passwordMatch = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!passwordMatch) return null

        return {
          id:             user.id,
          name:           user.nome,
          email:          user.email,
          role:           user.role,
          organizationId: user.organizationId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id             = user.id
        token.role           = (user as any).role
        token.organizationId = (user as any).organizationId
      }
      return token
    },
    session({ session, token }) {
      session.user.id             = token.id             as string
      session.user.role           = token.role           as any
      session.user.organizationId = token.organizationId as string
      return session
    },
  },
  pages:   { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
})
```

- [ ] **Step 3: Criar `app/api/auth/[...nextauth]/route.ts`**

```bash
mkdir -p "app/api/auth/[...nextauth]"
```

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

- [ ] **Step 4: Adicionar `NEXTAUTH_SECRET` ao `.env`**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiar o output e adicionar ao `.env`:

```env
NEXTAUTH_SECRET=<output_do_comando_acima>
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add auth.ts types/next-auth.d.ts "app/api/auth/[...nextauth]/route.ts"
git commit -m "feat: NextAuth credentials provider + JWT callbacks"
```

---

## Task 7: Middleware + login page

**Files:**
- Create: `middleware.ts`
- Create: `app/login/page.tsx`

- [ ] **Step 1: Criar `middleware.ts`** na raiz do projeto

```typescript
// middleware.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { UserRole } from '@prisma/client'

const PUBLIC_ROUTES = ['/login']

const ROLE_REDIRECTS: Record<UserRole, string> = {
  ADMIN:       '/',
  OPERATOR:    '/baixa',
  SOLICITANTE: '/',
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (session?.user) {
      const dest = ROLE_REDIRECTS[session.user.role] ?? '/'
      return NextResponse.redirect(new URL(dest, req.url))
    }
    return NextResponse.next()
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon\\.ico).*)'],
}
```

- [ ] **Step 2: Criar `app/login/page.tsx`**

```typescript
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Package } from 'lucide-react'

export default function LoginPage() {
  const router  = useRouter()
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form   = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email:    form.get('email')    as string,
      password: form.get('password') as string,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email ou senha incorretos')
      return
    }

    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-primary flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">AlmoxControl</span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h1 className="text-base font-semibold text-foreground mb-1">Entrar</h1>
          <p className="text-[12px] text-muted-foreground mb-5">
            Acesse o painel de controle
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Senha
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-colors"
              />
            </div>

            {error && (
              <p className="text-[12px] text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-9 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          AlmoxControl · Controle de Almoxarifado
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Proteger `app/(dashboard)/layout.tsx`**

Abra o arquivo e adicione verificação de sessão. Substitua o conteúdo por:

```typescript
// app/(dashboard)/layout.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AppSidebar }      from '@/components/dashboard/AppSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { mockAlerts }      from '@/lib/mock-data/dashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const criticalCount = mockAlerts.filter((a) => a.severidade === 'CRITICO').length

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:block">
        <AppSidebar activeHref="/" />
      </div>
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

- [ ] **Step 4: Proteger `app/(operator)/layout.tsx`**

Abra o arquivo e adicione verificação de sessão no início da função:

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  // ...resto do layout existente
}
```

- [ ] **Step 5: Rodar dev e testar login**

```bash
npm run dev
```

Abrir `http://localhost:3000`. Deve redirecionar para `/login`.

Fazer login com `michel@uol.com.br` / `Admin@2026`. Deve redirecionar para `/` (dashboard).

- [ ] **Step 6: Verificar TypeScript + testes**

```bash
npx tsc --noEmit
npm test
```

Esperado: sem erros de TypeScript, todos os testes passam.

- [ ] **Step 7: Commit**

```bash
git add middleware.ts app/login/page.tsx app/(dashboard)/layout.tsx app/(operator)/layout.tsx
git commit -m "feat: NextAuth middleware, login page, protected layouts"
```

---

## Task 8: API Routes — Dashboard (5 endpoints)

**Files:**
- Create: `app/api/dashboard/kpis/route.ts`
- Create: `app/api/dashboard/movements/route.ts`
- Create: `app/api/dashboard/alerts/route.ts`
- Create: `app/api/dashboard/critical-items/route.ts`
- Create: `app/api/dashboard/monthly-consumption/route.ts`

- [ ] **Step 1: Criar diretórios**

```bash
mkdir -p app/api/dashboard/kpis app/api/dashboard/movements app/api/dashboard/alerts app/api/dashboard/critical-items app/api/dashboard/monthly-consumption
```

- [ ] **Step 2: Criar `app/api/dashboard/kpis/route.ts`**

```typescript
// app/api/dashboard/kpis/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [productWarehouses, saidasHoje, itensCadastrados] = await Promise.all([
    db.productWarehouse.findMany({
      where: { product: { organizationId } },
      include: { product: { select: { custoUnitario: true, ativo: true } } },
    }),
    db.stockMovement.count({
      where: { organizationId, tipo: 'SAIDA', createdAt: { gte: startOfDay } },
    }),
    db.product.count({ where: { organizationId, ativo: true } }),
  ])

  const valorEstoque = productWarehouses.reduce(
    (acc, pw) => acc + pw.estoqueAtual * Number(pw.product.custoUnitario ?? 0), 0
  )

  const itensAbaixoMinimo = productWarehouses.filter(
    (pw) => pw.product.ativo && pw.estoqueAtual < pw.estoqueMinimo
  ).length

  return NextResponse.json({
    valorEstoque,
    itensCadastrados,
    itensAbaixoMinimo,
    saidasHoje,
    deltas: {
      valorEstoque:      { value: 0, direction: 'neutral' },
      itensCadastrados:  { value: 0, direction: 'neutral' },
      itensAbaixoMinimo: { value: 0, direction: 'neutral' },
      saidasHoje:        { value: 0, direction: 'neutral' },
    },
  })
}
```

- [ ] **Step 3: Criar `app/api/dashboard/movements/route.ts`**

```typescript
// app/api/dashboard/movements/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const movements = await db.stockMovement.findMany({
    where:   { organizationId, createdAt: { gte: startOfDay } },
    orderBy: { createdAt: 'desc' },
    take:    10,
    include: {
      product:  { select: { nome: true, unidadeConsumo: true } },
      user:     { select: { nome: true } },
      warehouse:{ select: { nome: true } },
    },
  })

  const rows = movements.map((m) => ({
    id:       m.id,
    tipo:     m.tipo,
    itemNome: m.product.nome,
    quantidade: m.quantidade,
    unidade:  m.product.unidadeConsumo.toLowerCase(),
    hora:     m.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    usuario:  m.user.nome,
  }))

  return NextResponse.json(rows)
}
```

- [ ] **Step 4: Criar `app/api/dashboard/alerts/route.ts`**

```typescript
// app/api/dashboard/alerts/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const pws = await db.productWarehouse.findMany({
    where:   { product: { organizationId, ativo: true } },
    include: { product: { select: { nome: true } } },
    orderBy: { estoqueAtual: 'asc' },
  })

  const alerts = pws
    .filter((pw) => pw.estoqueAtual < pw.estoqueMinimo)
    .map((pw, i) => {
      const pct = pw.estoqueMinimo > 0 ? pw.estoqueAtual / pw.estoqueMinimo : 0
      const severidade = pw.estoqueAtual === 0 ? 'CRITICO'
        : pct < 0.5 ? 'CRITICO'
        : 'ALERTA'
      return {
        id:        `alert-${i}`,
        severidade,
        mensagem:  pw.estoqueAtual === 0
          ? `${pw.product.nome} — zerado`
          : `${pw.product.nome} abaixo do mínimo`,
        meta: `Estoque: ${pw.estoqueAtual} · Mín: ${pw.estoqueMinimo}`,
      }
    })

  return NextResponse.json(alerts)
}
```

- [ ] **Step 5: Criar `app/api/dashboard/critical-items/route.ts`**

```typescript
// app/api/dashboard/critical-items/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const pws = await db.productWarehouse.findMany({
    where:   { product: { organizationId, ativo: true }, estoqueAtual: { lt: db.productWarehouse.fields.estoqueMinimo } },
    include: { product: { select: { nome: true, unidadeConsumo: true } } },
    orderBy: { estoqueAtual: 'asc' },
    take:    5,
  })

  const items = pws.map((pw) => ({
    id:            pw.productId,
    nome:          pw.product.nome,
    estoqueAtual:  pw.estoqueAtual,
    estoqueMinimo: pw.estoqueMinimo,
    unidade:       pw.product.unidadeConsumo.toLowerCase(),
  }))

  return NextResponse.json(items)
}
```

> Nota: `db.productWarehouse.fields.estoqueMinimo` pode não funcionar em todas as versões do Prisma. Se falhar, use query raw ou filtre em memória:
>
> ```typescript
> const all = await db.productWarehouse.findMany({ where: { product: { organizationId, ativo: true } }, include: { product: { select: { nome: true, unidadeConsumo: true } } } })
> const pws = all.filter(pw => pw.estoqueAtual < pw.estoqueMinimo).slice(0, 5)
> ```

- [ ] **Step 6: Criar `app/api/dashboard/monthly-consumption/route.ts`**

```typescript
// app/api/dashboard/monthly-consumption/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const movements = await db.stockMovement.findMany({
    where:   { organizationId, tipo: 'SAIDA', createdAt: { gte: sixMonthsAgo } },
    select:  { quantidade: true, createdAt: true },
  })

  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const now = new Date()
  const result = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - (5 - i))
    return { mes: MESES[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), unidades: 0 }
  })

  for (const m of movements) {
    const slot = result.find(
      (r) => r.month === m.createdAt.getMonth() && r.year === m.createdAt.getFullYear()
    )
    if (slot) slot.unidades += Math.abs(m.quantidade)
  }

  return NextResponse.json(result.map(({ mes, unidades }) => ({ mes, unidades })))
}
```

- [ ] **Step 7: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 8: Testar endpoints com curl**

Com o servidor rodando (`npm run dev`) e banco populado, testar cada endpoint. Primeiro, obter o cookie de sessão via login:

```bash
# Login via POST (retorna cookie)
curl -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=michel@uol.com.br&password=Admin@2026&csrfToken=$(curl -s http://localhost:3000/api/auth/csrf | python3 -c 'import sys,json;print(json.load(sys.stdin)[\"csrfToken\"])')"

# Testar KPIs
curl -b /tmp/cookies.txt http://localhost:3000/api/dashboard/kpis
```

Esperado: JSON com `valorEstoque`, `itensCadastrados`, `itensAbaixoMinimo`, `saidasHoje`.

- [ ] **Step 9: Commit**

```bash
git add app/api/dashboard/
git commit -m "feat: dashboard API routes — 5 endpoints with real DB queries"
```

---

## Task 9: API Routes — Produtos (3 routes)

**Files:**
- Create: `app/api/produtos/route.ts`
- Create: `app/api/produtos/[id]/route.ts`
- Create: `app/api/produtos/search/route.ts`

- [ ] **Step 1: Criar diretórios**

```bash
mkdir -p app/api/produtos app/api/produtos/search "app/api/produtos/[id]"
```

- [ ] **Step 2: Criar `app/api/produtos/route.ts`**

```typescript
// app/api/produtos/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const { searchParams } = new URL(req.url)
  const query      = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const ativo      = searchParams.get('ativo')

  const products = await db.product.findMany({
    where: {
      organizationId,
      ...(ativo !== null ? { ativo: ativo === 'true' } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(query ? {
        OR: [
          { nome:          { contains: query, mode: 'insensitive' } },
          { codigoInterno: { contains: query, mode: 'insensitive' } },
          { codigoBarras:  { equals:   query } },
        ],
      } : {}),
    },
    include: {
      category:          { select: { id: true, nome: true, cor: true } },
      productWarehouses: true,
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(products)
}

const createSchema = z.object({
  nome:           z.string().min(2).max(120),
  categoryId:     z.string().cuid(),
  tipoEmbalagem:  z.enum(['FARDO','GALAO','CAIXA','PACOTE','PAR','UNIDADE','ROLO','SACO','BISNAGA','FRASCO']),
  unidadeConsumo: z.enum(['UN','KG','G','L','ML','M','CM','PAR','CX']),
  fatorEmbalagem: z.number().min(0.001),
  controlarPor:   z.enum(['EMBALAGEM','CONSUMO']).default('EMBALAGEM'),
  codigoInterno:  z.string().max(20).optional(),
  codigoBarras:   z.string().max(50).optional(),
  custoUnitario:  z.number().min(0).optional(),
  estoqueAtual:   z.number().min(0).default(0),
  estoqueMinimo:  z.number().min(0).default(0),
  ativo:          z.boolean().default(true),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, id: userId } = session.user

  const body   = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid', details: parsed.error.issues }, { status: 400 })
  }

  const { estoqueAtual, estoqueMinimo, ...productData } = parsed.data

  // Verificar que a categoria pertence à organização
  const cat = await db.category.findFirst({ where: { id: productData.categoryId, organizationId } })
  if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  // Buscar warehouse padrão da organização
  const warehouse = await db.warehouse.findFirst({ where: { organizationId, ativo: true } })
  if (!warehouse) return NextResponse.json({ error: 'No warehouse found' }, { status: 404 })

  const product = await db.product.create({
    data: {
      ...productData,
      organizationId,
      productWarehouses: {
        create: { warehouseId: warehouse.id, estoqueAtual, estoqueMinimo },
      },
    },
    include: { category: true, productWarehouses: true },
  })

  return NextResponse.json(product, { status: 201 })
}
```

- [ ] **Step 3: Criar `app/api/produtos/[id]/route.ts`**

```typescript
// app/api/produtos/[id]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const product = await db.product.findFirst({
    where:   { id, organizationId },
    include: { category: true, productWarehouses: true },
  })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(product)
}

const updateSchema = z.object({
  nome:           z.string().min(2).max(120).optional(),
  categoryId:     z.string().cuid().optional(),
  custoUnitario:  z.number().min(0).optional(),
  fatorEmbalagem: z.number().min(0.001).optional(),
  tipoEmbalagem:  z.enum(['FARDO','GALAO','CAIXA','PACOTE','PAR','UNIDADE','ROLO','SACO','BISNAGA','FRASCO']).optional(),
  unidadeConsumo: z.enum(['UN','KG','G','L','ML','M','CM','PAR','CX']).optional(),
  controlarPor:   z.enum(['EMBALAGEM','CONSUMO']).optional(),
  estoqueMinimo:  z.number().min(0).optional(),
  estoqueMaximo:  z.number().min(0).optional(),
  localizacao:    z.string().max(60).optional(),
  ativo:          z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.product.findFirst({ where: { id, organizationId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body   = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid', details: parsed.error.issues }, { status: 400 })
  }

  const { estoqueMinimo, estoqueMaximo, localizacao, ...productFields } = parsed.data

  const warehouse = await db.warehouse.findFirst({ where: { organizationId, ativo: true } })

  const product = await db.product.update({
    where: { id },
    data:  {
      ...productFields,
      ...(warehouse && (estoqueMinimo !== undefined || estoqueMaximo !== undefined || localizacao !== undefined)
        ? {
            productWarehouses: {
              upsert: {
                where:  { productId_warehouseId: { productId: id, warehouseId: warehouse.id } },
                update: { estoqueMinimo, estoqueMaximo, localizacao },
                create: { warehouseId: warehouse.id, estoqueAtual: 0, estoqueMinimo: estoqueMinimo ?? 0 },
              },
            },
          }
        : {}),
    },
    include: { category: true, productWarehouses: true },
  })

  return NextResponse.json(product)
}
```

- [ ] **Step 4: Criar `app/api/produtos/search/route.ts`**

```typescript
// app/api/produtos/search/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const { searchParams } = new URL(req.url)
  const q           = searchParams.get('q') ?? ''
  const warehouseId = searchParams.get('warehouseId') ?? ''

  if (q.length < 2) return NextResponse.json([])

  const products = await db.product.findMany({
    where: {
      organizationId,
      ativo: true,
      OR: [
        { nome:          { contains: q, mode: 'insensitive' } },
        { codigoInterno: { contains: q, mode: 'insensitive' } },
        { codigoBarras:  { equals: q } },
      ],
    },
    include: {
      category:          { select: { nome: true } },
      productWarehouses: warehouseId ? { where: { warehouseId } } : true,
    },
    take: 20,
  })

  return NextResponse.json(products)
}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/api/produtos/
git commit -m "feat: produtos API routes — GET/POST list, GET/PATCH by id, search"
```

---

## Task 10: API Route — Movimentações (POST com transação)

**Files:**
- Create: `app/api/movimentacoes/route.ts`
- Create: `__tests__/api/movimentacoes.test.ts`

- [ ] **Step 1: Escrever testes do endpoint (TDD — falham primeiro)**

```typescript
// __tests__/api/movimentacoes.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do módulo de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Mock do Prisma
vi.mock('@/lib/db', () => ({
  db: {
    productWarehouse: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (fn: Function) => fn({
      productWarehouse: {
        findUnique: vi.fn().mockResolvedValue({
          productId:     'prod-1',
          warehouseId:   'wh-1',
          estoqueAtual:  10,
          estoqueMinimo: 5,
        }),
        update: vi.fn(),
      },
      stockMovement: {
        create: vi.fn().mockResolvedValue({
          id:            'mov-1',
          tipo:          'SAIDA',
          quantidade:    -3,
          estoqueAntes:  10,
          estoqueDepois: 7,
        }),
      },
    })),
  },
}))

import { auth } from '@/auth'
import { POST } from '@/app/api/movimentacoes/route'

const mockAuth = auth as ReturnType<typeof vi.fn>

describe('POST /api/movimentacoes', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', organizationId: 'org-1' },
    })
  })

  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ productId: 'p1', warehouseId: 'w1', tipo: 'SAIDA', quantidade: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('retorna 400 com quantidade zero', async () => {
    const req = new Request('http://localhost/api/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ productId: 'p1', warehouseId: 'w1', tipo: 'SAIDA', quantidade: 0 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 com payload inválido (tipo errado)', async () => {
    const req = new Request('http://localhost/api/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ productId: 'p1', warehouseId: 'w1', tipo: 'INVALIDO', quantidade: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 201 com movimento criado para SAIDA válida', async () => {
    const req = new Request('http://localhost/api/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ productId: 'prod-1', warehouseId: 'wh-1', tipo: 'SAIDA', quantidade: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.tipo).toBe('SAIDA')
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

```bash
npx vitest run __tests__/api/movimentacoes.test.ts
```

Esperado: `Cannot find module '@/app/api/movimentacoes/route'`

- [ ] **Step 3: Criar `app/api/movimentacoes/route.ts`**

```bash
mkdir -p app/api/movimentacoes
```

```typescript
// app/api/movimentacoes/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  productId:   z.string().cuid(),
  warehouseId: z.string(),
  tipo:        z.enum(['ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA']),
  quantidade:  z.number().positive(),
  observacao:  z.string().max(200).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 })
  }

  const { productId, warehouseId, tipo, quantidade, observacao } = parsed.data
  const { organizationId, id: userId } = session.user

  try {
    const movement = await db.$transaction(async (tx) => {
      const pw = await tx.productWarehouse.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } },
      })
      if (!pw) throw new Error('ProductWarehouse not found')

      const delta      = tipo === 'SAIDA' ? -quantidade : quantidade
      const novoEstoque = pw.estoqueAtual + delta

      if ((tipo === 'SAIDA' || tipo === 'AJUSTE') && novoEstoque < 0) {
        throw new Error('Estoque insuficiente')
      }

      await tx.productWarehouse.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data:  { estoqueAtual: novoEstoque },
      })

      return tx.stockMovement.create({
        data: {
          tipo,
          quantidade:    delta,
          estoqueAntes:  pw.estoqueAtual,
          estoqueDepois: novoEstoque,
          observacao,
          productId,
          warehouseId,
          userId,
          organizationId,
        },
      })
    })

    return NextResponse.json(movement, { status: 201 })

  } catch (err: any) {
    if (err.message === 'Estoque insuficiente') {
      return NextResponse.json({ error: 'Estoque insuficiente' }, { status: 422 })
    }
    if (err.message === 'ProductWarehouse not found') {
      return NextResponse.json({ error: 'Produto não encontrado no almoxarifado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Rodar — esperar verde**

```bash
npx vitest run __tests__/api/movimentacoes.test.ts
```

Esperado: `✓ 4 tests passed`

- [ ] **Step 5: Verificar TypeScript + todos os testes**

```bash
npx tsc --noEmit && npm test
```

Esperado: sem erros de TypeScript, todos os testes passam.

- [ ] **Step 6: Commit**

```bash
git add app/api/movimentacoes/ __tests__/api/movimentacoes.test.ts
git commit -m "feat: movimentacoes POST — atomic transaction with stock update (TDD)"
```

---

## Task 11: Ligar dashboard UI à API real

**Files:**
- Modify: `app/(dashboard)/page.tsx`

- [ ] **Step 1: Substituir `app/(dashboard)/page.tsx`**

```typescript
// app/(dashboard)/page.tsx
import { cookies } from 'next/headers'
import { KpiCard }                 from '@/components/dashboard/KpiCard'
import { DonutMini }               from '@/components/dashboard/DonutMini'
import { MonthlyConsumptionChart } from '@/components/dashboard/MonthlyConsumptionChart'
import { AlertList }               from '@/components/dashboard/AlertList'
import { CriticalItemsList }       from '@/components/dashboard/CriticalItemsList'
import { MovementsTable }          from '@/components/dashboard/MovementsTable'
import { DollarSign, Package, AlertTriangle, ArrowLeftRight } from 'lucide-react'
import { formatCurrency, formatNumber, formatDelta } from '@/lib/format'
import { mockCategories } from '@/lib/mock-data/dashboard'

async function fetchDashboard(path: string, cookieHeader: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/dashboard/${path}`, {
    cache:   'no-store',
    headers: { cookie: cookieHeader },
  })
  if (!res.ok) return null
  return res.json()
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const [kpi, movements, alerts, criticalItems, monthlyData] = await Promise.all([
    fetchDashboard('kpis',                 cookieHeader),
    fetchDashboard('movements',            cookieHeader),
    fetchDashboard('alerts',               cookieHeader),
    fetchDashboard('critical-items',       cookieHeader),
    fetchDashboard('monthly-consumption',  cookieHeader),
  ])

  const { valorEstoque, itensCadastrados, itensAbaixoMinimo, saidasHoje, deltas } = kpi ?? {
    valorEstoque: 0, itensCadastrados: 0, itensAbaixoMinimo: 0, saidasHoje: 0,
    deltas: {
      valorEstoque:      { value: 0, direction: 'neutral' },
      itensCadastrados:  { value: 0, direction: 'neutral' },
      itensAbaixoMinimo: { value: 0, direction: 'neutral' },
      saidasHoje:        { value: 0, direction: 'neutral' },
    },
  }

  return (
    <div className="h-full p-3.5 flex flex-col gap-3 overflow-hidden">

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-[repeat(4,1fr)_88px] gap-2.5 flex-shrink-0">
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
        <div className="col-span-2 lg:col-span-1">
          <DonutMini categories={mockCategories} />
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_260px] gap-2.5 flex-1 min-h-0 overflow-auto xl:overflow-hidden">
        <MonthlyConsumptionChart data={monthlyData ?? []} />
        <MovementsTable movements={movements ?? []} />
        <div className="flex flex-col gap-2.5 overflow-hidden">
          <AlertList alerts={alerts ?? []} />
          <CriticalItemsList items={criticalItems ?? []} />
        </div>
      </div>

    </div>
  )
}
```

> O `DonutMini` continua usando `mockCategories` — será substituído quando o endpoint de categorias for criado em v0.2.

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Rodar dev e verificar dashboard com dados reais**

```bash
npm run dev
```

Abrir `http://localhost:3000`. Após login, verificar:
- KPIs mostram dados do banco (valorEstoque calculado, 7 itens cadastrados, etc.)
- Tabela de movimentações mostra as 6 movimentações do seed
- Alertas mostram itens abaixo do mínimo

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/page.tsx"
git commit -m "feat: dashboard connected to real API — replaces all mock data"
```

---

## Task 12: Ligar produtos UI à API real

**Files:**
- Modify: `app/(dashboard)/produtos/page.tsx`

- [ ] **Step 1: Atualizar `app/(dashboard)/produtos/page.tsx`**

Substituir a linha que importa `mockProducts` e `mockCategories` por um `useEffect` que busca os dados da API. Como a página já é `'use client'`, adicionar o fetch ao montar o componente:

```typescript
// app/(dashboard)/produtos/page.tsx
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { ProductsHeader }     from '@/components/products/ProductsHeader'
import { ProductsFilters }    from '@/components/products/ProductsFilters'
import { ProductsSummary }    from '@/components/products/ProductsSummary'
import { ProductsTable }      from '@/components/products/ProductsTable'
import { ProductsPagination } from '@/components/products/ProductsPagination'
import { ProductSheet }       from '@/components/products/ProductSheet'
import { ProductsTableSkeleton } from '@/components/products/ProductsTableSkeleton'
import { filterAndSortProducts, paginate } from '@/lib/filter-products'
import { exportToExcel } from '@/lib/excel'
import type { Product, Category } from '@/types/product'
import type { ProductFormValues } from '@/lib/validations/product'
import type { FilterState } from '@/lib/filter-products'
import type { ActiveFilter } from '@/components/products/ProductsFilters'

type PageSize = 10 | 25 | 50

interface PageState {
  filter: FilterState
  page: number
  pageSize: PageSize
  sheetOpen: boolean
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
      // Map Prisma Product to types/product.ts Product shape
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

  function openNew()                  { setState(s => ({ ...s, sheetOpen: true, editingProduct: null })) }
  function openEdit(p: Product)       { setState(s => ({ ...s, sheetOpen: true, editingProduct: p })) }
  function closeSheet()               { setState(s => ({ ...s, sheetOpen: false, editingProduct: null })) }
  function clearFilter(key: string)   { setFilter({ [key]: '' } as Partial<FilterState>) }

  async function handleSave(data: ProductFormValues) {
    const method = state.editingProduct ? 'PATCH' : 'POST'
    const url    = state.editingProduct
      ? `/api/produtos/${state.editingProduct.id}`
      : '/api/produtos'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const updated = await fetch('/api/produtos').then(r => r.json())
      setProducts(updated.map((p: any) => ({ ...p, warehouse: p.productWarehouses?.[0] ?? null })))
      closeSheet()
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
      />
    </div>
  )
}
```

> **Nota:** A rota `/api/produtos/categories` não foi criada ainda — adicionar em `app/api/produtos/categories/route.ts`:
>
> ```typescript
> import { NextResponse } from 'next/server'
> import { auth } from '@/auth'
> import { db } from '@/lib/db'
>
> export async function GET() {
>   const session = await auth()
>   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
>   const cats = await db.category.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { nome: 'asc' } })
>   return NextResponse.json(cats)
> }
> ```

- [ ] **Step 2: Criar `app/api/produtos/categories/route.ts`**

```bash
mkdir -p app/api/produtos/categories
```

Criar o arquivo com o código da nota acima.

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Testar visualmente**

Acessar `http://localhost:3000/produtos` após login. Os 7 produtos do seed devem aparecer na tabela.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/produtos/" app/api/produtos/categories/
git commit -m "feat: produtos page connected to real API"
```

---

## Task 13: Ligar operador baixa à API real

**Files:**
- Modify: `app/(operator)/baixa/page.tsx`

- [ ] **Step 1: Identificar os pontos de integração na BaixaPage**

Abra `app/(operator)/baixa/page.tsx` e localize:
1. A função de busca de produto — atualmente usa `mockProducts` ou busca local
2. A função de registrar baixa — atualmente usa a offline queue

- [ ] **Step 2: Substituir busca de produto para usar `/api/produtos/search`**

Encontrar a função de busca (provavelmente dentro de um `useCallback` ou `useEffect` que reage ao campo de busca) e substituir por:

```typescript
async function searchProducts(query: string): Promise<Product[]> {
  if (query.length < 2) return []
  const warehouse = await fetch('/api/warehouses/default').then(r => r.json()).catch(() => null)
  const warehouseId = warehouse?.id ?? ''
  const res = await fetch(`/api/produtos/search?q=${encodeURIComponent(query)}&warehouseId=${warehouseId}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.map((p: any) => ({ ...p, warehouse: p.productWarehouses?.[0] ?? null }))
}
```

> **Nota:** Adicionar `/api/warehouses/default/route.ts` que retorna o primeiro warehouse ativo da organização:
>
> ```typescript
> import { NextResponse } from 'next/server'
> import { auth } from '@/auth'
> import { db } from '@/lib/db'
>
> export async function GET() {
>   const session = await auth()
>   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
>   const wh = await db.warehouse.findFirst({ where: { organizationId: session.user.organizationId, ativo: true } })
>   if (!wh) return NextResponse.json({ error: 'Not found' }, { status: 404 })
>   return NextResponse.json(wh)
> }
> ```

- [ ] **Step 3: Criar `app/api/warehouses/default/route.ts`**

```bash
mkdir -p app/api/warehouses/default
```

Criar o arquivo com o código acima.

- [ ] **Step 4: Substituir a função de registrar baixa para usar `/api/movimentacoes`**

Encontrar a função que registra a baixa (ou enfileira na offline queue) e adicionar a chamada real à API quando online:

```typescript
async function registrarBaixa(productId: string, warehouseId: string, quantidade: number) {
  const res = await fetch('/api/movimentacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, warehouseId, tipo: 'SAIDA', quantidade }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao registrar baixa')
  }
  return res.json()
}
```

> A offline queue existente (`lib/offline-queue.ts`) permanece para uso sem internet — quando online, a chamada vai direto para a API.

- [ ] **Step 5: Verificar TypeScript + todos os testes**

```bash
npx tsc --noEmit && npm test
```

Esperado: sem erros de TypeScript, todos os testes passam.

- [ ] **Step 6: Commit**

```bash
git add "app/(operator)/" app/api/warehouses/
git commit -m "feat: operator baixa connected to real API — search + movement POST"
```

---

## Task 14: Verificação final + build de produção

- [ ] **Step 1: Rodar todos os testes**

```bash
npm test
```

Esperado: todos os testes passam (inclui novos testes de movimentações).

- [ ] **Step 2: Verificar TypeScript completo**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Build de produção**

```bash
npm run build
```

Esperado: `✓ Compiled successfully` com todas as rotas listadas:
- `/login`
- `/` (dashboard)
- `/produtos`
- `/baixa`
- `/api/auth/[...nextauth]`
- `/api/dashboard/*` (5)
- `/api/produtos` e derivadas
- `/api/movimentacoes`

- [ ] **Step 4: Teste de ponta a ponta no browser**

```bash
npm run dev
```

Fluxo completo:
1. Acessar `http://localhost:3000` → redireciona para `/login` ✓
2. Login com `michel@uol.com.br` / `Admin@2026` → redireciona para `/` ✓
3. Dashboard exibe KPIs com dados reais ✓
4. Página de produtos exibe 7 produtos do seed ✓
5. Criar novo produto → aparece na lista ✓
6. Acessar `/baixa` → buscar "álcool" → dar baixa de 1 unidade ✓
7. Voltar ao dashboard → saída aparece nas movimentações ✓
8. Acessar `/login` estando logado → redireciona para `/` ✓

- [ ] **Step 5: Update servidor ZimaOS**

```bash
cd /DATA/AppData/stocky
git pull origin master
sudo docker compose build app
sudo docker compose up -d
sudo docker compose exec app npx prisma migrate deploy
sudo SEED_FORCE=1 docker compose exec app npx prisma db seed
```

> **Atenção:** `SEED_FORCE=1` apenas na primeira vez. Nas próximas atualizações, omitir o seed.

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "chore: database + auth + API routes complete — app fully connected to PostgreSQL"
git push origin master
```
