import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const { searchParams } = new URL(req.url)
  const query      = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const ativo      = searchParams.get('ativo')

  const products = await db.product.findMany({
    where: {
      organizationId,
      ...(ativo !== null ? { ativo: ativo === 'true' } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(query ? {
        OR: [
          { nome:          { contains: query, mode: 'insensitive' } },
          { codigoInterno: { contains: query, mode: 'insensitive' } },
          { codigoBarras:  { equals:   query } },
        ],
      } : {}),
    },
    include: {
      category:          { select: { id: true, nome: true, cor: true } },
      productWarehouses: true,
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(products)
}

const createSchema = z.object({
  nome:           z.string().min(2).max(120),
  categoryId:     z.string().cuid(),
  tipoEmbalagem:  z.enum(['FARDO','GALAO','CAIXA','PACOTE','PAR','UNIDADE','ROLO','SACO','BISNAGA','FRASCO']),
  unidadeConsumo: z.enum(['UN','KG','G','L','ML','M','CM','PAR','CX']),
  fatorEmbalagem: z.number().min(0.001),
  controlarPor:   z.enum(['EMBALAGEM','CONSUMO']).default('EMBALAGEM'),
  codigoInterno:  z.string().max(20).optional(),
  codigoBarras:   z.string().max(50).optional(),
  custoUnitario:  z.number().min(0).optional(),
  estoqueAtual:   z.number().min(0).default(0),
  estoqueMinimo:  z.number().min(0).default(0),
  ativo:          z.boolean().default(true),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const body   = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid', details: parsed.error.issues }, { status: 400 })
  }

  const { estoqueAtual, estoqueMinimo, ...productData } = parsed.data

  const cat = await db.category.findFirst({ where: { id: productData.categoryId, organizationId } })
  if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  const warehouse = await db.warehouse.findFirst({ where: { organizationId, ativo: true }, orderBy: { createdAt: 'asc' } })
  if (!warehouse) return NextResponse.json({ error: 'No warehouse found' }, { status: 404 })

  const product = await db.product.create({
    data: {
      ...productData,
      organizationId,
      productWarehouses: {
        create: { warehouseId: warehouse.id, estoqueAtual, estoqueMinimo },
      },
    },
    include: { category: true, productWarehouses: true },
  })

  return NextResponse.json(product, { status: 201 })
}
