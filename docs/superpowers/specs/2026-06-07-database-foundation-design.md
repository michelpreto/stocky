# AlmoxControl — Fundação BD · Design Spec

**Data:** 2026-06-07  
**Status:** Aprovado  
**Fase do produto:** MVP (v0.1) — "Substituir a planilha"  
**Referência:** `almoxcontrol-CLAUDE.md` §2.3, §3.4  
**Subsistema:** 1 de 3 (Fundação BD → Auth → API Routes)

---

## 1. Objetivo

Configurar o Prisma ORM com schema multi-tenant de 7 models, gerar as migrations iniciais, implementar o Prisma client singleton para Next.js e rodar o seed com os dados da planilha original. Esta fundação é pré-condição para os Subsistemas 2 (Auth) e 3 (API Routes).

---

## 2. Dependências

```bash
npm install @prisma/client bcryptjs
npm install -D prisma @types/bcryptjs tsx
npx prisma init
```

`prisma init` cria:
- `prisma/schema.prisma` — editado neste spec
- `.env` com `DATABASE_URL` — já existe no projeto (criado no setup do servidor)

---

## 3. Schema Prisma

Arquivo: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────────

model Organization {
  id         String   @id @default(cuid())
  nome       String
  slug       String   @unique
  logo       String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  users       User[]
  warehouses  Warehouse[]
  categories  Category[]
  products    Product[]
  movements   StockMovement[]
}

model User {
  id             String    @id @default(cuid())
  nome           String
  email          String    @unique
  passwordHash   String
  role           UserRole  @default(OPERATOR)
  ativo          Boolean   @default(true)
  organizationId String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization Organization    @relation(fields: [organizationId], references: [id])
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
  id               String         @id @default(cuid())
  codigoInterno    String?
  nome             String
  codigoBarras     String?
  categoryId       String
  tipoEmbalagem    TipoEmbalagem
  unidadeConsumo   UnidadeConsumo
  fatorEmbalagem   Float          @default(1)
  controlarPor     ControlarPor   @default(EMBALAGEM)
  custoUnitario    Decimal?       @db.Decimal(12, 2)
  foto             String?
  fichaSeguranca   String?
  ativo            Boolean        @default(true)
  organizationId   String
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  organization      Organization       @relation(fields: [organizationId], references: [id])
  category          Category           @relation(fields: [categoryId], references: [id])
  productWarehouses ProductWarehouse[]
  movements         StockMovement[]
}

model ProductWarehouse {
  productId      String
  warehouseId    String
  estoqueAtual   Float   @default(0)
  estoqueMinimo  Float   @default(0)
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

---

## 4. Prisma Client Singleton

Arquivo: `lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

Padrão oficial Next.js — evita múltiplas instâncias do PrismaClient durante hot reload em desenvolvimento.

---

## 5. Tipos compostos

Arquivo: `types/db.ts`

```typescript
import type { Product, ProductWarehouse, StockMovement, User, Category, Warehouse } from '@prisma/client'

export type ProductWithWarehouse = Product & {
  warehouse: ProductWarehouse | null
  category: Category
}

export type MovementWithRelations = StockMovement & {
  product: Pick<Product, 'id' | 'nome' | 'unidadeConsumo'>
  user: Pick<User, 'id' | 'nome'>
  warehouse: Pick<Warehouse, 'id' | 'nome'>
}
```

---

## 6. Seed

Arquivo: `prisma/seed.ts`

Dados semeados (em ordem de dependência):

1. **Organization** — `{ nome: 'Minha Empresa', slug: 'minha-empresa' }`
2. **User** (admin) — `michel@uol.com.br`, senha `Admin@2026`, role `ADMIN`, hash bcrypt rounds=12
3. **Warehouse** — `Almoxarifado Principal`
4. **5 Categories** — Limpeza (`#3B82F6`), Copa (`#22C55E`), EPI (`#F59E0B`), Descartáveis (`#A855F7`), Ferramentas (`#64748B`)
5. **7 Products** — espelhados de `lib/mock-data/products.ts` com seus `ProductWarehouse` (estoqueAtual e estoqueMinimo)
6. **6 StockMovements** — as movimentações de `lib/mock-data/dashboard.ts` (entradas/saídas de hoje)

**Guard de produção:**

```typescript
if (process.env.NODE_ENV === 'production' && !process.env.SEED_FORCE) {
  console.log('Seed ignorado em produção. Use SEED_FORCE=1 para forçar.')
  process.exit(0)
}
```

**Referência em `package.json`:**
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

---

## 7. Fluxo de desenvolvimento

```bash
# Configurar DATABASE_URL no .env local (apontar para postgres local ou docker)
# Gerar migration inicial
npx prisma migrate dev --name init

# Rodar seed
npx prisma db seed

# Inspecionar dados visualmente
npx prisma studio

# Verificar tipos TypeScript gerados
npx tsc --noEmit
```

### PostgreSQL local para dev

```bash
# Subir só o postgres via docker (sem o app)
docker run -d --name almox-dev-postgres \
  -e POSTGRES_USER=almox \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=almoxcontrol \
  -p 5432:5432 \
  postgres:16-alpine
```

`.env` local (não versionado):
```env
DATABASE_URL="postgresql://almox:devpass@localhost:5432/almoxcontrol"
```

---

## 8. Em produção (ZimaOS)

```bash
# Após docker compose up -d
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
# (seed ignorado automaticamente a menos que SEED_FORCE=1)
```

---

## 9. Estrutura de arquivos

```
prisma/
  schema.prisma        ← schema com 7 models + 5 enums
  migrations/          ← gerado automaticamente
    0001_init/
      migration.sql
  seed.ts              ← seed com guard de produção

lib/
  db.ts                ← Prisma client singleton

types/
  db.ts                ← tipos compostos (ProductWithWarehouse, etc.)
  product.ts           ← tipos de formulário (mantidos — usados pelo ProductSheet)
```

---

## 10. Testes

Arquivo: `__tests__/lib/db-seed.test.ts`

Testa apenas funções puras do seed (hash de senha, geração de slug) — sem hit real no banco em CI:

```typescript
import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'

describe('seed utilities', () => {
  it('gera hash de senha válido', async () => {
    const hash = await bcrypt.hash('Admin@2026', 12)
    expect(await bcrypt.compare('Admin@2026', hash)).toBe(true)
    expect(await bcrypt.compare('senha-errada', hash)).toBe(false)
  })

  it('gera slug a partir do nome da organização', () => {
    const toSlug = (nome: string) =>
      nome.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    expect(toSlug('Minha Empresa')).toBe('minha-empresa')
    expect(toSlug('Álcool & Cia')).toBe('alcool--cia')
  })
})
```

---

## 11. Pré-condições para Subsistema 2 (Auth)

Ao final deste subsistema:
- Tabela `User` existe com campo `email` + `passwordHash`
- `lib/db.ts` exporta o client `db`
- Tipos `@prisma/client` disponíveis para import
- Um user admin (`michel@uol.com.br`) no banco com senha bcrypt
