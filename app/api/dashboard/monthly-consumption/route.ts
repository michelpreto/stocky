import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const movements = await db.stockMovement.findMany({
    where:  { organizationId, tipo: 'SAIDA', createdAt: { gte: sixMonthsAgo } },
    select: { quantidade: true, createdAt: true },
  })

  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const now = new Date()
  const result = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - (5 - i))
    return { mes: MESES[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), unidades: 0 }
  })

  for (const m of movements) {
    const slot = result.find(
      (r) => r.month === m.createdAt.getMonth() && r.year === m.createdAt.getFullYear()
    )
    if (slot) slot.unidades += Math.abs(m.quantidade)
  }

  return NextResponse.json(result.map(({ mes, unidades }) => ({ mes, unidades })))
}
