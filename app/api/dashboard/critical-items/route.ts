import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const all = await db.productWarehouse.findMany({
    where:   { product: { organizationId, ativo: true } },
    include: { product: { select: { nome: true, unidadeConsumo: true } } },
  })

  const items = all
    .filter((pw) => pw.estoqueAtual < pw.estoqueMinimo)
    .sort((a, b) => a.estoqueAtual - b.estoqueAtual)
    .slice(0, 5)
    .map((pw) => ({
      id:            pw.productId,
      nome:          pw.product.nome,
      estoqueAtual:  pw.estoqueAtual,
      estoqueMinimo: pw.estoqueMinimo,
      unidade:       pw.product.unidadeConsumo.toLowerCase(),
    }))

  return NextResponse.json(items)
}
