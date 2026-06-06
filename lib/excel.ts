// lib/excel.ts
import * as XLSX from 'xlsx'
import { getStockStatus, gerarDescricaoEmbalagem } from '@/types/product'
import type { Product } from '@/types/product'

export function exportToExcel(products: Product[]): void {
  const rows = products.map((p) => ({
    'Código':          p.codigoInterno ?? '',
    'Nome':            p.nome,
    'Categoria':       p.category?.nome ?? '',
    'Embalagem':       gerarDescricaoEmbalagem(p.tipoEmbalagem, p.fatorEmbalagem, p.unidadeConsumo),
    'Estoque Atual':   p.warehouse?.estoqueAtual ?? '',
    'Estoque Mínimo':  p.warehouse?.estoqueMinimo ?? '',
    'Custo Unit. (R$)': p.custoUnitario?.toFixed(2) ?? '',
    'Status':          getStockStatus(p),
    'Ativo':           p.ativo ? 'Sim' : 'Não',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook  = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos')

  const date     = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `almoxcontrol-produtos-${date}.xlsx`)
}
