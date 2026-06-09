// types/next-auth.d.ts
import type { DefaultSession } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import type { UserRole } from '@/lib/generated/prisma'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: UserRole
      organizationId: string
    }
  }
  interface User {
    role: UserRole
    organizationId: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    organizationId: string
  }
}
