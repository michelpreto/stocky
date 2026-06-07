# AlmoxControl — Autenticação · Design Spec

**Data:** 2026-06-07  
**Status:** Aprovado  
**Fase do produto:** MVP (v0.1)  
**Referência:** `almoxcontrol-CLAUDE.md` §4.2, §2.1 RF-09  
**Subsistema:** 2 de 3 (Fundação BD → **Auth** → API Routes)  
**Pré-condição:** Subsistema 1 (Fundação BD) implementado — tabela `User` com `email` + `passwordHash`

---

## 1. Objetivo

Implementar autenticação email + senha via NextAuth.js (Auth.js v5) com sessão JWT, middleware de proteção de rotas e redirecionamento por role após login. O resultado é um app onde nenhuma rota do dashboard ou operador é acessível sem sessão válida.

---

## 2. Stack

| Camada | Tecnologia |
|--------|------------|
| Auth framework | NextAuth.js (Auth.js v5) — `next-auth@beta` |
| Provider | `CredentialsProvider` — email + senha |
| Sessão | JWT (stateless — sem tabela de sessão no banco) |
| Hash de senha | `bcryptjs` (rounds=12) — instalado no Subsistema 1 |
| Proteção de rotas | Next.js Middleware (`middleware.ts`) |

---

## 3. Fluxo de autenticação

```
[Usuário não autenticado]
        │
        ▼
  GET /login  (página pública)
        │
        ▼
  POST /api/auth/callback/credentials
        │  (NextAuth verifica email+senha via DB)
        ▼
  Senha válida? ──── NÃO ──► Erro "Credenciais inválidas"
        │ SIM
        ▼
  Gera JWT com { userId, email, nome, role, organizationId }
        │
        ▼
  Redireciona por role:
    ADMIN      → /
    OPERATOR   → /baixa
    SOLICITANTE → /solicitacoes (futuro — redireciona para / por ora)
```

---

## 4. Configuração NextAuth

Arquivo: `auth.ts` (na raiz do projeto)

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
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
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.organizationId = token.organizationId as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
})
```

---

## 5. Tipagem da sessão

Arquivo: `types/next-auth.d.ts`

```typescript
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

---

## 6. Route Handlers do NextAuth

Arquivo: `app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

---

## 7. Middleware de proteção

Arquivo: `middleware.ts` (na raiz do projeto)

```typescript
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login']
const ROLE_REDIRECTS: Record<string, string> = {
  ADMIN:       '/',
  OPERATOR:    '/baixa',
  SOLICITANTE: '/',
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.includes(pathname)
  const session = req.auth

  // Rota pública: deixa passar
  if (isPublic) {
    // Se já autenticado, redireciona para home do role
    if (session?.user) {
      const dest = ROLE_REDIRECTS[session.user.role] ?? '/'
      return NextResponse.redirect(new URL(dest, req.url))
    }
    return NextResponse.next()
  }

  // Rota protegida sem sessão: vai para login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 8. Página de login

Arquivo: `app/login/page.tsx`

Client Component com formulário email + senha. Estados: idle, loading, error.

```typescript
'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
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
    // UI: formulário OLED dark — logo AlmoxControl + campos email/senha + botão
    // Design: bg-background, card bg-card, border-border, input com focus-ring
    // Erro: texto text-danger abaixo do botão
    <div>{ /* implementado na task */ }</div>
  )
}
```

> A UI completa do formulário de login (HTML/JSX) é implementada na task do plano, não descrita aqui para evitar duplicação.

---

## 9. Proteção nos layouts

Arquivo: `app/(dashboard)/layout.tsx` — adicionar verificação de sessão:

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  // ...resto do layout
}
```

Igual para `app/(operator)/layout.tsx`.

---

## 10. Estrutura de arquivos

```
auth.ts                              ← config NextAuth (Credentials + callbacks)
middleware.ts                        ← proteção de rotas + redirect por role
types/
  next-auth.d.ts                     ← extensão de tipos da sessão
app/
  login/
    page.tsx                         ← formulário de login (Client Component)
  api/
    auth/
      [...nextauth]/
        route.ts                     ← GET + POST handlers do NextAuth
  (dashboard)/
    layout.tsx                       ← verificação de sessão (modificar existente)
  (operator)/
    layout.tsx                       ← verificação de sessão (modificar existente)
```

---

## 11. Dependências

```bash
npm install next-auth@beta
```

> `bcryptjs` já instalado no Subsistema 1.

---

## 12. Testes

Arquivo: `__tests__/auth/login.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('authorize (lógica de login)', () => {
  it('retorna null para email não encontrado', async () => {
    // Mock db.user.findUnique → null
    // Chama authorize({ email, password })
    // Espera retorno null
  })

  it('retorna null para senha incorreta', async () => {
    // Mock db.user.findUnique → user com hash de 'senha-certa'
    // Chama authorize com 'senha-errada'
    // Espera retorno null
  })

  it('retorna user para credenciais válidas', async () => {
    // Mock db.user.findUnique → user com hash bcrypt correto
    // Chama authorize com senha correta
    // Espera retorno com { id, email, role, organizationId }
  })

  it('retorna null para usuário inativo', async () => {
    // Mock user com ativo=false
    // Espera retorno null mesmo com senha correta
  })
})
```

---

## 13. Pré-condições para Subsistema 3 (API Routes)

Ao final deste subsistema:
- `auth()` disponível para uso em Server Components e Route Handlers
- `session.user.organizationId` acessível em qualquer rota — base do multi-tenancy
- Todas as rotas do dashboard e operador protegidas
- Credencial padrão: `michel@uol.com.br` / `Admin@2026`
