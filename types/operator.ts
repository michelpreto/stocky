// types/operator.ts

export interface SearchResult {
  id: string
  nome: string
  codigoInterno: string
  codigoBarras?: string
  categoria: string
  unidade: string
  estoqueAtual: number
  estoqueMinimo: number
  foto?: string
}

export type MotivoType =
  | 'CONSUMO_ROTINEIRO'
  | 'QUEBRA'
  | 'VENCIMENTO'
  | 'OUTRO'

export interface BaixaInput {
  produtoId: string
  quantidade: number
  unidade: string
  setorId: string
  motivo: MotivoType
  observacao?: string
}

export interface RecentBaixa {
  id: string
  produtoNome: string
  quantidade: number
  unidade: string
  hora: string        // "HH:mm"
  expiresAt: number   // Date.now() + 60_000
  synced: boolean
}

export interface Setor {
  id: string
  nome: string
  usageCount: number
}
