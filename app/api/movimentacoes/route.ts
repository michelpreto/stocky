import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

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
