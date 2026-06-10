import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const warehouses = await db.warehouse.findMany({
    where: { organizationId },
    select: {
      id:        true,
      nome:      true,
      descricao: true,
      ativo:     true,
      createdAt: true,
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(warehouses)
}

const postSchema = z.object({
  nome:      z.string().min(2).max(100),
  descricao: z.string().max(200).optional(),
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

  const warehouse = await db.warehouse.create({
    data: {
      nome:      parsed.data.nome,
      descricao: parsed.data.descricao,
      organizationId,
    },
    select: {
      id:        true,
      nome:      true,
      descricao: true,
      ativo:     true,
      createdAt: true,
    },
  })

  return NextResponse.json(warehouse, { status: 201 })
}
