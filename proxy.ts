// proxy.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/lib/generated/prisma'

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
