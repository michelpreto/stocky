// Script de importação de produtos — executar com: npx tsx prisma/import-products.ts
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config')
}

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

const PRODUTOS = [
  { codigo: '102884', nome: 'ACUCAR DA BARRA C/10KG',                   tipo: 'FARDO',    uc: 'UN', fator: 10,  qtd: 8,  custo: 42.00,  cat: 'Copa'    },
  { codigo: '101382', nome: 'AGUA SANITARIA 5L TALGE',                   tipo: 'GALAO',    uc: 'UN', fator: 1,   qtd: 12, custo: 15.83,  cat: 'Limpeza' },
  { codigo: '101883', nome: 'ALCOOL LIQ 70 1L HIDRAL',                   tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 40, custo: 8.91,   cat: 'Limpeza' },
  { codigo: '131400', nome: 'BALDE 12L ARQPLAST REFORCADO',              tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 6,  custo: 14.47,  cat: 'Limpeza' },
  { codigo: '111280', nome: 'CAFE PILAO A VACUO TRADIC 500G',            tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 69, custo: 31.00,  cat: 'Copa'    },
  { codigo: '135443', nome: 'DESINF 5L KALIPTO LAVANDA',                 tipo: 'GALAO',    uc: 'UN', fator: 1,   qtd: 3,  custo: 25.53,  cat: 'Limpeza' },
  { codigo: '101190', nome: 'DETERG 500ML YPE NEUTRO',                   tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 22, custo: 2.84,   cat: 'Limpeza' },
  { codigo: null,     nome: 'ESPONJA BUCHINHA DE LAVAR LOCA',            tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 0,  custo: null,   cat: 'Limpeza' },
  { codigo: '107385', nome: 'FRASCO C/PULVERIZADOR 500ML',               tipo: 'FRASCO',   uc: 'UN', fator: 1,   qtd: 6,  custo: 7.91,   cat: 'Limpeza' },
  { codigo: '101926', nome: 'INSET AERO 380ML SBP MULTI EMB ECON',       tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 11, custo: 20.63,  cat: 'Limpeza' },
  { codigo: '103855', nome: 'LA DE ACO BOMBRIL',                         tipo: 'PACOTE',   uc: 'UN', fator: 8,   qtd: 5,  custo: 2.58,   cat: 'Limpeza' },
  { codigo: '102490', nome: 'LAVA ROUPAS PO 4KG TIXAN PRIMAV SACHE',    tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 10, custo: 40.51,  cat: 'Limpeza' },
  { codigo: '106938', nome: 'LAVATINA C/SUPORTE DSR (VASSOURA DE VASO)', tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 7,  custo: 7.61,   cat: 'Limpeza' },
  { codigo: '102753', nome: 'LEITE PIRACANJUBA INTEGRAL EDGE 12X1L',     tipo: 'CAIXA',    uc: 'UN', fator: 12,  qtd: 24, custo: 42.00,  cat: 'Copa'    },
  { codigo: '124692', nome: 'LIMPA PEDRA 5L CONCENTRAX AUDAX',           tipo: 'GALAO',    uc: 'UN', fator: 1,   qtd: 2,  custo: 94.50,  cat: 'Limpeza' },
  { codigo: '102147', nome: 'LIMPADOR 5L GERAL LUNNIS CAMPESTRE',        tipo: 'GALAO',    uc: 'UN', fator: 1,   qtd: 6,  custo: 28.73,  cat: 'Limpeza' },
  { codigo: null,     nome: 'LUVA SANRO TOP FORRADA MD VERDE CA 40045',  tipo: 'PAR',      uc: 'PAR',fator: 1,   qtd: 6,  custo: 9.65,   cat: 'EPI'     },
  { codigo: '100730', nome: 'MULTIUSO 500ML VEJA ORIG AZUL',             tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 31, custo: 4.85,   cat: 'Limpeza' },
  { codigo: '101503', nome: 'ODOR 360ML BOM AR TALCO EMBA ECON',         tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 6,  custo: 8.91,   cat: 'Limpeza' },
  { codigo: '130590', nome: 'PA DE LIXO JEITOSA BETTANIN C/CABO',       tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 9,  custo: 25.07,  cat: 'Limpeza' },
  { codigo: '101033', nome: 'REMOVEDOR 900ML GITANES S/PERFUME PRETO',   tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 12, custo: 4.85,   cat: 'Limpeza' },
  { codigo: '105973', nome: 'RODO PLAST SIMPLES 40CM C/CABO CONDOR',     tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 13, custo: 22.31,  cat: 'Limpeza' },
  { codigo: '117360', nome: 'S. LIXO PRETO 100L P4 SAQ C/100',          tipo: 'SACO',     uc: 'UN', fator: 100, qtd: 28, custo: null,   cat: 'Limpeza' },
  { codigo: null,     nome: 'S. LIXO PRETO 60L P4 SAQ C/100',           tipo: 'SACO',     uc: 'UN', fator: 100, qtd: 16, custo: null,   cat: 'Limpeza' },
  { codigo: '102397', nome: 'SABAO PEDRA 160G YPE GLICERINADO C/5',     tipo: 'PACOTE',   uc: 'UN', fator: 5,   qtd: 6,  custo: 12.55,  cat: 'Limpeza' },
  { codigo: '102009', nome: 'SACO ALVEJADO ESPECIAL 45X65 CAEBI C/6',   tipo: 'PACOTE',   uc: 'UN', fator: 6,   qtd: 6,  custo: null,   cat: 'Limpeza' },
  { codigo: '104149', nome: 'SACO XADREZ ESPECIAL 45X65 CAEBI C/6',     tipo: 'PACOTE',   uc: 'UN', fator: 6,   qtd: 10, custo: null,   cat: 'Limpeza' },
  { codigo: '104503', nome: 'SAPONACEO LIQ 250ML CIF CREMOSO ORIGINAL',  tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 46, custo: 26.73,  cat: 'Limpeza' },
  { codigo: '107083', nome: 'VASSOURA CERDAS MACIAS C/CABO',             tipo: 'UNIDADE',  uc: 'UN', fator: 1,   qtd: 6,  custo: 9.08,   cat: 'Limpeza' },
]

async function main() {
  const org = await db.organization.findFirst()
  if (!org) throw new Error('Nenhuma organização encontrada no banco.')

  const cats = await db.category.findMany({ where: { organizationId: org.id } })
  const catMap = Object.fromEntries(cats.map(c => [c.nome, c.id]))
  console.log('Categorias disponíveis:', cats.map(c => c.nome).join(', '))

  const warehouse = await db.warehouse.findFirst({ where: { organizationId: org.id, ativo: true }, orderBy: { createdAt: 'asc' } })
  if (!warehouse) throw new Error('Nenhum almoxarifado ativo encontrado.')
  console.log('Almoxarifado:', warehouse.nome)

  let ok = 0, fail = 0

  for (const p of PRODUTOS) {
    const categoryId = catMap[p.cat] ?? cats[0]?.id
    if (!categoryId) { console.error(`SKIP ${p.nome}: categoria "${p.cat}" não encontrada`); fail++; continue }

    try {
      await db.product.create({
        data: {
          codigoInterno:  p.codigo ?? undefined,
          nome:           p.nome,
          categoryId,
          tipoEmbalagem:  p.tipo as any,
          unidadeConsumo: p.uc as any,
          fatorEmbalagem: p.fator,
          controlarPor:   'EMBALAGEM',
          custoUnitario:  p.custo ?? undefined,
          ativo:          true,
          organizationId: org.id,
          productWarehouses: {
            create: { warehouseId: warehouse.id, estoqueAtual: p.qtd, estoqueMinimo: 0 },
          },
        },
      })
      console.log(`✓ ${p.nome}`)
      ok++
    } catch (e: any) {
      console.error(`✗ ${p.nome}: ${e.message}`)
      fail++
    }
  }

  console.log(`\n>>> ${ok} importados, ${fail} falhas <<<`)
}

main().finally(() => pool.end())
