export type TipoEmbalagem =
  | 'FARDO' | 'GALAO' | 'CAIXA' | 'PACOTE' | 'PAR'
  | 'UNIDADE' | 'ROLO' | 'SACO' | 'BISNAGA' | 'FRASCO'

export type UnidadeConsumo =
  | 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'PAR' | 'CX'

export type ControlarPor = 'EMBALAGEM' | 'CONSUMO'

export type StockStatus = 'normal' | 'baixo' | 'critico' | 'zerado' | 'rascunho'

export interface Category {
  id: string
  nome: string
  cor?: string
}

export interface ProductWarehouse {
  estoqueAtual: number
  estoqueMinimo: number
  estoqueMaximo?: number
  pontoReposicao?: number
  localizacao?: string
}

export interface Product {
  id: string
  codigoInterno?: string
  nome: string
  codigoBarras?: string
  categoryId: string
  category?: Category
  tipoEmbalagem: TipoEmbalagem
  unidadeConsumo: UnidadeConsumo
  fatorEmbalagem: number
  controlarPor: ControlarPor
  descricaoEmbalagem?: string
  custoUnitario?: number
  foto?: string
  fichaSeguranca?: string
  ativo: boolean
  warehouse?: ProductWarehouse
  createdAt: string
  updatedAt: string
}

export function getStockStatus(product: Product): StockStatus {
  if (!product.ativo || !product.codigoInterno) return 'rascunho'
  const w = product.warehouse
  if (!w) return 'rascunho'
  if (w.estoqueAtual === 0) return 'zerado'
  if (w.estoqueAtual < w.estoqueMinimo * 0.5) return 'critico'
  if (w.estoqueAtual < w.estoqueMinimo) return 'baixo'
  return 'normal'
}

const PREFIXOS: Record<TipoEmbalagem, string> = {
  FARDO:   'FD', GALAO:   'GL', CAIXA:  'CX', PACOTE: 'PCT', PAR:     'PR',
  UNIDADE: 'UN', ROLO:    'RL', SACO:   'SC', BISNAGA:'BG', FRASCO:  'FR',
}

export function gerarDescricaoEmbalagem(
  tipo: TipoEmbalagem,
  fator: number,
  unidade: UnidadeConsumo,
): string {
  return `${PREFIXOS[tipo]}-${fator}${unidade}`
}
