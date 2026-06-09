import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const product = await db.product.findFirst({
    where:   { id, organizationId },
    include: { category: true, productWarehouses: true },
  })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(product)
}

const updateSchema = z.object({
  nome:           z.string().min(2).max(120).optional(),
  categoryId:     z.string().cuid().optional(),
  custoUnitario:  z.number().min(0).optional(),
  fatorEmbalagem: z.number().min(0.001).optional(),
  tipoEmbalagem:  z.enum(['FARDO','GALAO','CAIXA','PACOTE','PAR','UNIDADE','ROLO','SACO','BISNAGA','FRASCO']).optional(),
  unidadeConsumo: z.enum(['UN','KG','G','L','ML','M','CM','PAR','CX']).optional(),
  controlarPor:   z.enum(['EMBALAGEM','CONSUMO']).optional(),
  estoqueMinimo:  z.number().min(0).optional(),
  estoqueMaximo:  z.number().min(0).optional(),
  localizacao:    z.string().max(60).optional(),
  ativo:          z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user
  const { id } = await params

  const existing = await db.product.findFirst({ where: { id, organizationId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body   = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid', details: parsed.error.issues }, { status: 400 })
  }

  const { estoqueMinimo, estoqueMaximo, localizacao, ...productFields } = parsed.data

  const warehouse = await db.warehouse.findFirst({ where: { organizationId, ativo: true }, orderBy: { createdAt: 'asc' } })
  const hasStockFields = estoqueMinimo !== undefined || estoqueMaximo !== undefined || localizacao !== undefined
  if (hasStockFields && !warehouse) {
    return NextResponse.json({ error: 'No active warehouse found for stock update' }, { status: 404 })
  }

  const product = await db.product.update({
    where: { id, organizationId },
    data:  {
      ...productFields,
      ...(warehouse && (estoqueMinimo !== undefined || estoqueMaximo !== undefined || localizacao !== undefined)
        ? {
            productWarehouses: {
              upsert: {
                where:  { productId_warehouseId: { productId: id, warehouseId: warehouse.id } },
                update: { estoqueMinimo, estoqueMaximo, localizacao },
                create: { warehouseId: warehouse!.id, estoqueAtual: 0, estoqueMinimo: estoqueMinimo ?? 0, estoqueMaximo, localizacao },
              },
            },
          }
        : {}),
    },
    include: { category: true, productWarehouses: true },
  })

  return NextResponse.json(product)
}
