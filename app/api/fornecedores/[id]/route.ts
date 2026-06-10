import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const patchSchema = z.object({
  nome:     z.string().min(2).max(120).optional(),
  contato:  z.string().max(80).optional(),
  telefone: z.string().max(20).optional(),
  email:    z.string().email().optional().or(z.literal('')).transform(v => v || null),
  ativo:    z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.supplier.findFirst({
    where: { id, organizationId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })
  }

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.issues }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.nome     !== undefined) data.nome     = parsed.data.nome
  if (parsed.data.contato  !== undefined) data.contato  = parsed.data.contato
  if (parsed.data.telefone !== undefined) data.telefone = parsed.data.telefone
  if (parsed.data.email    !== undefined) data.email    = parsed.data.email
  if (parsed.data.ativo    !== undefined) data.ativo    = parsed.data.ativo

  const supplier = await db.supplier.update({
    where: { id },
    data,
    select: {
      id:        true,
      nome:      true,
      contato:   true,
      telefone:  true,
      email:     true,
      ativo:     true,
      createdAt: true,
    },
  })

  return NextResponse.json(supplier)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.supplier.findFirst({
    where: { id, organizationId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })
  }

  await db.supplier.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
