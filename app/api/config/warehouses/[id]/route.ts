import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const patchSchema = z.object({
  nome:      z.string().min(2).max(100).optional(),
  descricao: z.string().max(200).optional(),
  ativo:     z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.warehouse.findFirst({
    where: { id, organizationId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Almoxarifado não encontrado' }, { status: 404 })
  }

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.issues }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.nome      !== undefined) data.nome      = parsed.data.nome
  if (parsed.data.descricao !== undefined) data.descricao = parsed.data.descricao
  if (parsed.data.ativo     !== undefined) data.ativo     = parsed.data.ativo

  const warehouse = await db.warehouse.update({
    where: { id },
    data,
    select: {
      id:        true,
      nome:      true,
      descricao: true,
      ativo:     true,
      createdAt: true,
    },
  })

  return NextResponse.json(warehouse)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.warehouse.findFirst({
    where: { id, organizationId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Almoxarifado não encontrado' }, { status: 404 })
  }

  const movCount = await db.stockMovement.count({
    where: { warehouseId: id },
  })
  if (movCount > 0) {
    return NextResponse.json(
      { error: `Não é possível excluir: este almoxarifado possui ${movCount} movimentação(ões) registrada(s)` },
      { status: 409 },
    )
  }

  await db.warehouse.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
