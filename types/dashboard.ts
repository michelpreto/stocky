// types/dashboard.ts

export type DeltaDirection = 'up' | 'down' | 'neutral'

export interface KpiDelta {
  value: number
  direction: DeltaDirection
  suffix?: string
}

export interface KpiData {
  valorEstoque: number
  itensCadastrados: number
  itensAbaixoMinimo: number
  saidasHoje: number
  deltas: {
    valorEstoque: KpiDelta
    itensCadastrados: KpiDelta
    itensAbaixoMinimo: KpiDelta
    saidasHoje: KpiDelta
  }
}

export interface CategorySlice {
  nome: string
  percentual: number
  cor: string
}

export interface MonthlyData {
  mes: string
  unidades: number
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA'

export interface MovementRow {
  id: string
  tipo: MovementType
  itemNome: string
  quantidade: number
  unidade: string
  hora: string
  usuario: string
}

export type AlertSeverity = 'CRITICO' | 'ALERTA' | 'INFO'

export interface AlertItem {
  id: string
  severidade: AlertSeverity
  mensagem: string
  meta: string
}

export interface CriticalItem {
  id: string
  nome: string
  estoqueAtual: number
  estoqueMinimo: number
  unidade: string
}

export interface Warehouse {
  id: string
  nome: string
  online: boolean
}
