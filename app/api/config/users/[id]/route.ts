import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const patchSchema = z.object({
  nome:     z.string().min(2).max(100).optional(),
  email:    z.string().email().optional(),
  role:     z.enum(['ADMIN', 'OPERATOR', 'SOLICITANTE']).optional(),
  ativo:    z.boolean().optional(),
  password: z.string().min(6).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.user.findFirst({
    where: { id, organizationId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.issues }, { status: 400 })
  }

  const { nome, email, role, ativo, password } = parsed.data

  const data: Record<string, unknown> = {}
  if (nome     !== undefined) data.nome     = nome
  if (email    !== undefined) data.email    = email
  if (role     !== undefined) data.role     = role
  if (ativo    !== undefined) data.ativo    = ativo
  if (password !== undefined) data.passwordHash = await bcrypt.hash(password, 10)

  const user = await db.user.update({
    where: { id },
    data,
    select: {
      id:        true,
      nome:      true,
      email:     true,
      role:      true,
      ativo:     true,
      createdAt: true,
    },
  })

  return NextResponse.json(user)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.user.findFirst({
    where: { id, organizationId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const user = await db.user.update({
    where: { id },
    data:  { ativo: false },
    select: {
      id:    true,
      nome:  true,
      ativo: true,
    },
  })

  return NextResponse.json(user)
}
