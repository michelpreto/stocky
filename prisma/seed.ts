import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_FORCE) {
    console.log('Seed ignorado em produção. Use SEED_FORCE=1 para forçar.')
    return
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const db = new PrismaClient({ adapter })

  try {
    console.log('Seeding...')

    // 1. Organization
    const org = await db.organization.upsert({
      where:  { slug: 'minha-empresa' },
      update: {},
      create: { nome: 'Minha Empresa', slug: 'minha-empresa' },
    })
    console.log('  ✓ Organization:', org.nome)

    // 2. Admin user
    const passwordHash = await bcrypt.hash('Admin@2026', 12)
    const admin = await db.user.upsert({
      where:  { email: 'michel@uol.com.br' },
      update: {},
      create: {
        nome: 'Michel', email: 'michel@uol.com.br',
        passwordHash, role: 'ADMIN', organizationId: org.id,
      },
    })
    console.log('  ✓ User:', admin.email)

    // 3. Warehouse
    const warehouse = await db.warehouse.upsert({
      where:  { id: 'warehouse-principal' },
      update: {},
      create: { id: 'warehouse-principal', nome: 'Almoxarifado Principal', organizationId: org.id },
    })
    console.log('  ✓ Warehouse:', warehouse.nome)

    // 4. Categories
    const categoryData = [
      { nome: 'Limpeza',      cor: '#3B82F6' },
      { nome: 'Copa',         cor: '#22C55E' },
      { nome: 'EPI',          cor: '#F59E0B' },
      { nome: 'Descartáveis', cor: '#A855F7' },
      { nome: 'Ferramentas',  cor: '#64748B' },
    ]
    const categories: Record<string, { id: string }> = {}
    for (const cat of categoryData) {
      const c = await db.category.upsert({
        where:  { id: `cat-${cat.nome.toLowerCase().replace(/[^a-z]/g, '')}` },
        update: {},
        create: { id: `cat-${cat.nome.toLowerCase().replace(/[^a-z]/g, '')}`, ...cat, organizationId: org.id },
      })
      categories[cat.nome] = c
      console.log('  ✓ Category:', c.nome)
    }

    // 5. Products + ProductWarehouses
    const products = [
      {
        id: 'prod-alcool', codigoInterno: '00034', nome: 'Álcool 70% 1L Talge',
        codigoBarras: '7891082036424', categoryNome: 'Limpeza',
        tipoEmbalagem: 'UNIDADE' as const, unidadeConsumo: 'UN' as const,
        fatorEmbalagem: 1, custoUnitario: 4.50,
        estoqueAtual: 8, estoqueMinimo: 20,
      },
      {
        id: 'prod-agua-sanitaria', codigoInterno: '00041', nome: 'Água Sanitária 5L Talge',
        categoryNome: 'Limpeza',
        tipoEmbalagem: 'GALAO' as const, unidadeConsumo: 'L' as const,
        fatorEmbalagem: 5, custoUnitario: 12.80,
        estoqueAtual: 2, estoqueMinimo: 8,
      },
      {
        id: 'prod-luva', codigoInterno: '00078', nome: 'Luva Nitrílica P',
        categoryNome: 'EPI',
        tipoEmbalagem: 'CAIXA' as const, unidadeConsumo: 'UN' as const,
        fatorEmbalagem: 100, custoUnitario: 89.00,
        estoqueAtual: 1, estoqueMinimo: 6,
      },
      {
        id: 'prod-papel', codigoInterno: '00092', nome: 'Papel Toalha PCT c/2',
        categoryNome: 'Limpeza',
        tipoEmbalagem: 'PACOTE' as const, unidadeConsumo: 'UN' as const,
        fatorEmbalagem: 2, custoUnitario: 6.20,
        estoqueAtual: 4, estoqueMinimo: 12,
      },
      {
        id: 'prod-esponja', nome: 'Esponja de Aço',
        categoryNome: 'Limpeza', ativo: false,
        tipoEmbalagem: 'UNIDADE' as const, unidadeConsumo: 'UN' as const,
        fatorEmbalagem: 1,
        estoqueAtual: 0, estoqueMinimo: 0,
      },
      {
        id: 'prod-detergente', codigoInterno: '00015', nome: 'Detergente 500ml',
        categoryNome: 'Limpeza',
        tipoEmbalagem: 'UNIDADE' as const, unidadeConsumo: 'ML' as const,
        fatorEmbalagem: 500, custoUnitario: 2.90,
        estoqueAtual: 12, estoqueMinimo: 15,
      },
      {
        id: 'prod-sabao', codigoInterno: '00023', nome: 'Sabão em Pó 1kg',
        categoryNome: 'Limpeza',
        tipoEmbalagem: 'FARDO' as const, unidadeConsumo: 'KG' as const,
        fatorEmbalagem: 10, custoUnitario: 8.50,
        estoqueAtual: 25, estoqueMinimo: 10,
      },
    ]

    for (const p of products) {
      const { estoqueAtual, estoqueMinimo, categoryNome, ativo = true, ...productData } = p
      const categoryId = categories[categoryNome].id

      const product = await db.product.upsert({
        where:  { id: p.id },
        update: {},
        create: { ...productData, categoryId, organizationId: org.id, ativo },
      })

      await db.productWarehouse.upsert({
        where:  { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
        update: {},
        create: { productId: product.id, warehouseId: warehouse.id, estoqueAtual, estoqueMinimo },
      })
      console.log('  ✓ Product:', product.nome)
    }

    // 6. Sample StockMovements
    const today = new Date()
    const movements = [
      { productId: 'prod-alcool',         tipo: 'SAIDA'   as const, quantidade: -4,  desc: 'Baixa de consumo' },
      { productId: 'prod-detergente',     tipo: 'ENTRADA' as const, quantidade: 24,  desc: 'Recebimento' },
      { productId: 'prod-papel',          tipo: 'SAIDA'   as const, quantidade: -6,  desc: 'Baixa de consumo' },
      { productId: 'prod-luva',           tipo: 'SAIDA'   as const, quantidade: -2,  desc: 'Baixa de consumo' },
      { productId: 'prod-agua-sanitaria', tipo: 'AJUSTE'  as const, quantidade: -1,  desc: 'Ajuste de inventário' },
      { productId: 'prod-sabao',          tipo: 'ENTRADA' as const, quantidade: 12,  desc: 'Recebimento fardo' },
    ]

    let movCount = 0
    for (const m of movements) {
      const pw = await db.productWarehouse.findUnique({
        where: { productId_warehouseId: { productId: m.productId, warehouseId: warehouse.id } },
      })
      if (!pw) continue

      await db.stockMovement.create({
        data: {
          tipo: m.tipo,
          quantidade: m.quantidade,
          estoqueAntes: pw.estoqueAtual,
          estoqueDepois: pw.estoqueAtual + m.quantidade,
          observacao: m.desc,
          productId: m.productId,
          warehouseId: warehouse.id,
          userId: admin.id,
          organizationId: org.id,
          createdAt: new Date(today.getTime() - Math.random() * 6 * 60 * 60 * 1000),
        },
      })
      movCount++
    }
    console.log(`  ✓ StockMovements: ${movCount} created`)

    console.log('\nSeed concluído.')
    console.log('Login: michel@uol.com.br / Admin@2026')
  } finally {
    await db.$disconnect()
    await pool.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
