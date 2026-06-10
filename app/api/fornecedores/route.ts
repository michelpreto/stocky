import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  const where: any = { organizationId }
  if (q) {
    where.nome = { contains: q, mode: 'insensitive' }
  }

  const suppliers = await db.supplier.findMany({
    where,
    select: {
      id:        true,
      nome:      true,
      contato:   true,
      telefone:  true,
      email:     true,
      ativo:     true,
      createdAt: true,
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(suppliers)
}

const postSchema = z.object({
  nome:     z.string().min(2).max(120),
  contato:  z.string().max(80).optional(),
  telefone: z.string().max(20).optional(),
  email:    z.string().email().optional().or(z.literal('')).transform(v => v || null),
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

  const supplier = await db.supplier.create({
    data: {
      nome:          parsed.data.nome,
      contato:       parsed.data.contato,
      telefone:      parsed.data.telefone,
      email:         parsed.data.email,
      organizationId,
    },
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

  return NextResponse.json(supplier, { status: 201 })
}
