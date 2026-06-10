import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const users = await db.user.findMany({
    where: { organizationId },
    select: {
      id:        true,
      nome:      true,
      email:     true,
      role:      true,
      ativo:     true,
      createdAt: true,
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(users)
}

const postSchema = z.object({
  nome:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(['ADMIN', 'OPERATOR', 'SOLICITANTE']),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const body   = await req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.issues }, { status: 400 })
  }

  const { nome, email, password, role } = parsed.data

  const existing = await db.user.findFirst({
    where: { email, organizationId },
  })
  if (existing) {
    return NextResponse.json({ error: 'E-mail já cadastrado nesta organização' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await db.user.create({
    data: { nome, email, passwordHash, role, organizationId },
    select: {
      id:        true,
      nome:      true,
      email:     true,
      role:      true,
      ativo:     true,
      createdAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
