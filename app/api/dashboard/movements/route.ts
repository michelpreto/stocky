import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const movements = await db.stockMovement.findMany({
    where:   { organizationId, createdAt: { gte: startOfDay } },
    orderBy: { createdAt: 'desc' },
    take:    10,
    include: {
      product:   { select: { nome: true, unidadeConsumo: true } },
      user:      { select: { nome: true } },
      warehouse: { select: { nome: true } },
    },
  })

  const rows = movements.map((m) => ({
    id:         m.id,
    tipo:       m.tipo,
    itemNome:   m.product.nome,
    quantidade: m.quantidade,
    unidade:    m.product.unidadeConsumo.toLowerCase(),
    hora:       m.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    usuario:    m.user.nome,
  }))

  return NextResponse.json(rows)
}
