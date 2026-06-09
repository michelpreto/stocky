import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [productWarehouses, saidasHoje, itensCadastrados] = await Promise.all([
    db.productWarehouse.findMany({
      where: { product: { organizationId } },
      include: { product: { select: { custoUnitario: true, ativo: true } } },
    }),
    db.stockMovement.count({
      where: { organizationId, tipo: 'SAIDA', createdAt: { gte: startOfDay } },
    }),
    db.product.count({ where: { organizationId, ativo: true } }),
  ])

  const valorEstoque = productWarehouses.reduce(
    (acc, pw) => acc + pw.estoqueAtual * Number(pw.product.custoUnitario ?? 0), 0
  )

  const itensAbaixoMinimo = productWarehouses.filter(
    (pw) => pw.product.ativo && pw.estoqueAtual < pw.estoqueMinimo
  ).length

  return NextResponse.json({
    valorEstoque,
    itensCadastrados,
    itensAbaixoMinimo,
    saidasHoje,
    deltas: {
      valorEstoque:      { value: 0, direction: 'neutral' },
      itensCadastrados:  { value: 0, direction: 'neutral' },
      itensAbaixoMinimo: { value: 0, direction: 'neutral' },
      saidasHoje:        { value: 0, direction: 'neutral' },
    },
  })
}
