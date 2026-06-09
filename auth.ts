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
  trustHost: true,
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
        token.id             = user.id as string
        token.role           = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    session({ session, token }) {
      session.user.id             = token.id as string
      session.user.role           = token.role
      session.user.organizationId = token.organizationId
      return session
    },
  },
  pages:   { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
})
