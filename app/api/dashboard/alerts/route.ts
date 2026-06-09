import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const pws = await db.productWarehouse.findMany({
    where:   { product: { organizationId, ativo: true } },
    include: { product: { select: { nome: true } } },
    orderBy: { estoqueAtual: 'asc' },
  })

  const alerts = pws
    .filter((pw) => pw.estoqueAtual < pw.estoqueMinimo)
    .map((pw, i) => {
      const pct = pw.estoqueMinimo > 0 ? pw.estoqueAtual / pw.estoqueMinimo : 0
      const severidade = pw.estoqueAtual === 0 ? 'CRITICO'
        : pct < 0.5 ? 'CRITICO'
        : 'ALERTA'
      return {
        id:        `alert-${i}`,
        severidade,
        mensagem:  pw.estoqueAtual === 0
          ? `${pw.product.nome} — zerado`
          : `${pw.product.nome} abaixo do mínimo`,
        meta: `Estoque: ${pw.estoqueAtual} · Mín: ${pw.estoqueMinimo}`,
      }
    })

  return NextResponse.json(alerts)
}
