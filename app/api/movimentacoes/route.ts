import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const { searchParams } = new URL(req.url)
  const q     = searchParams.get('q') ?? ''
  const tipo  = searchParams.get('tipo') ?? ''
  const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)))
  const skip  = (page - 1) * limit

  const where: any = { organizationId }
  if (tipo && ['ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA'].includes(tipo)) {
    where.tipo = tipo
  }
  if (q) {
    where.product = { nome: { contains: q, mode: 'insensitive' } }
  }

  const [items, total] = await Promise.all([
    db.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product:   { select: { id: true, nome: true, unidadeConsumo: true } },
        user:      { select: { id: true, nome: true } },
        warehouse: { select: { id: true, nome: true } },
      },
    }),
    db.stockMovement.count({ where }),
  ])

  return NextResponse.json({ items, total, page, limit })
}

const schema = z.object({
  productId:   z.string().cuid(),
  warehouseId: z.string(),
  tipo:        z.enum(['ENTRADA', 'SAIDA', 'AJUSTE']),
  quantidade:  z.number().positive(),
  observacao:  z.string().max(200).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 })
  }

  const { productId, warehouseId, tipo, quantidade, observacao } = parsed.data
  const { organizationId, id: userId } = session.user

  // Verify warehouse belongs to this org
  const warehouse = await db.warehouse.findFirst({
    where: { id: warehouseId, organizationId },
  })
  if (!warehouse) {
    return NextResponse.json({ error: 'Almoxarifado não encontrado' }, { status: 404 })
  }

  try {
    const movement = await db.$transaction(async (tx) => {
      const pw = await tx.productWarehouse.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } },
      })
      if (!pw) throw new Error('ProductWarehouse not found')

      const delta       = tipo === 'SAIDA' ? -quantidade : quantidade
      const novoEstoque = pw.estoqueAtual + delta

      if ((tipo === 'SAIDA' || tipo === 'AJUSTE') && novoEstoque < 0) {
        throw new Error('Estoque insuficiente')
      }

      await tx.productWarehouse.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data:  { estoqueAtual: novoEstoque },
      })

      return tx.stockMovement.create({
        data: {
          tipo,
          quantidade:    delta,
          estoqueAntes:  pw.estoqueAtual,
          estoqueDepois: novoEstoque,
          observacao,
          productId,
          warehouseId,
          userId,
          organizationId,
        },
      })
    })

    return NextResponse.json(movement, { status: 201 })

  } catch (err: any) {
    if (err.message === 'Estoque insuficiente') {
      return NextResponse.json({ error: 'Estoque insuficiente' }, { status: 422 })
    }
    if (err.message === 'ProductWarehouse not found') {
      return NextResponse.json({ error: 'Produto não encontrado no almoxarifado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
