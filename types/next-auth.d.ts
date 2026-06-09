// types/next-auth.d.ts
import type { DefaultSession } from 'next-auth'
import type { UserRole } from '@/lib/generated/prisma'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: UserRole
      organizationId: string
    }
  }
}
