import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const { searchParams } = new URL(req.url)
  const q           = searchParams.get('q') ?? ''
  const warehouseId = searchParams.get('warehouseId') ?? ''

  if (q.length < 2) return NextResponse.json([])

  const products = await db.product.findMany({
    where: {
      organizationId,
      ativo: true,
      OR: [
        { nome:          { contains: q, mode: 'insensitive' } },
        { codigoInterno: { contains: q, mode: 'insensitive' } },
        { codigoBarras:  { equals: q } },
      ],
    },
    include: {
      category:          { select: { nome: true } },
      productWarehouses: warehouseId ? { where: { warehouseId } } : true,
    },
    take: 20,
  })

  return NextResponse.json(products)
}
