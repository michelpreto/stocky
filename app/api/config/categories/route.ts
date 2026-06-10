import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const categories = await db.category.findMany({
    where: { organizationId },
    select: {
      id:        true,
      nome:      true,
      cor:       true,
      createdAt: true,
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(categories)
}

const postSchema = z.object({
  nome: z.string().min(2).max(60),
  cor:  z.string().max(7).optional(),
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

  const category = await db.category.create({
    data: {
      nome: parsed.data.nome,
      cor:  parsed.data.cor,
      organizationId,
    },
    select: {
      id:        true,
      nome:      true,
      cor:       true,
      createdAt: true,
    },
  })

  return NextResponse.json(category, { status: 201 })
}
