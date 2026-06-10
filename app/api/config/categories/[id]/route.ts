import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const patchSchema = z.object({
  nome: z.string().min(2).max(60).optional(),
  cor:  z.string().max(7).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.category.findFirst({
    where: { id, organizationId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
  }

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.issues }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.nome !== undefined) data.nome = parsed.data.nome
  if (parsed.data.cor  !== undefined) data.cor  = parsed.data.cor

  const category = await db.category.update({
    where: { id },
    data,
    select: {
      id:        true,
      nome:      true,
      cor:       true,
      createdAt: true,
    },
  })

  return NextResponse.json(category)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.category.findFirst({
    where: { id, organizationId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
  }

  const prodCount = await db.product.count({
    where: { categoryId: id },
  })
  if (prodCount > 0) {
    return NextResponse.json(
      { error: `Não é possível excluir: esta categoria possui ${prodCount} produto(s) vinculado(s)` },
      { status: 409 },
    )
  }

  await db.category.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
