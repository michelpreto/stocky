// lib/mock-data/dashboard.ts
import type {
  KpiData, CategorySlice, MonthlyData,
  MovementRow, AlertItem, CriticalItem, Warehouse,
} from '@/types/dashboard'

export const mockWarehouses: Warehouse[] = [
  { id: 'w1', nome: 'Almoxarifado Principal', online: true },
  { id: 'w2', nome: 'Almoxarifado Filial', online: false },
]

export const mockKpi: KpiData = {
  valorEstoque: 42830,
  itensCadastrados: 247,
  itensAbaixoMinimo: 14,
  saidasHoje: 38,
  deltas: {
    valorEstoque:      { value: 12.4, direction: 'up',     suffix: 'vs mês anterior' },
    itensCadastrados:  { value: 8,    direction: 'up',     suffix: 'este mês' },
    itensAbaixoMinimo: { value: 3,    direction: 'down',   suffix: 'vs semana passada' },
    saidasHoje:        { value: 0,    direction: 'neutral' },
  },
}

export const mockCategories: CategorySlice[] = [
  { nome: 'Limpeza',  percentual: 42, cor: '#3B82F6' },
  { nome: 'Copa',     percentual: 28, cor: '#22C55E' },
  { nome: 'EPI',      percentual: 18, cor: '#F59E0B' },
  { nome: 'Outros',   percentual: 12, cor: '#A855F7' },
]

export const mockMonthlyData: MonthlyData[] = [
  { mes: 'Jan', unidades: 312 },
  { mes: 'Fev', unidades: 289 },
  { mes: 'Mar', unidades: 401 },
  { mes: 'Abr', unidades: 378 },
  { mes: 'Mai', unidades: 455 },
  { mes: 'Jun', unidades: 512 },
]

export const mockAlerts: AlertItem[] = [
  { id: 'a1', severidade: 'CRITICO', mensagem: 'Álcool 70% zerado',                    meta: 'Estoque: 0 un · Mín: 20' },
  { id: 'a2', severidade: 'CRITICO', mensagem: 'Luva Nitrílica P — ruptura em 2 dias', meta: 'Estoque: 1 cx · Consumo: 0,5/dia' },
  { id: 'a3', severidade: 'CRITICO', mensagem: 'Água Sanitária 5L abaixo do mínimo',   meta: 'Estoque: 2 gl · Mín: 8' },
  { id: 'a4', severidade: 'ALERTA',  mensagem: 'Detergente 500ml — reposição sugerida',meta: 'Estoque: 12 un · Ponto: 15' },
  { id: 'a5', severidade: 'ALERTA',  mensagem: 'Café 500g — validade em 8 dias',       meta: 'Lote 2024-06B · Qtd: 4 pct' },
  { id: 'a6', severidade: 'INFO',    mensagem: 'Inventário vence em 5 dias',            meta: 'Ciclo mensal · Junho/2026' },
]

export const mockCriticalItems: CriticalItem[] = [
  { id: 'c1', nome: 'Álcool 70% 1L',     estoqueAtual: 0,  estoqueMinimo: 20, unidade: 'un'  },
  { id: 'c2', nome: 'Luva Nitrílica P',  estoqueAtual: 1,  estoqueMinimo: 6,  unidade: 'cx'  },
  { id: 'c3', nome: 'Água Sanitária 5L', estoqueAtual: 2,  estoqueMinimo: 8,  unidade: 'gl'  },
  { id: 'c4', nome: 'Papel Toalha PCT',  estoqueAtual: 4,  estoqueMinimo: 12, unidade: 'pct' },
  { id: 'c5', nome: 'Detergente 500ml',  estoqueAtual: 12, estoqueMinimo: 15, unidade: 'un'  },
]

export const mockMovements: MovementRow[] = [
  { id: 'm1', tipo: 'SAIDA',   itemNome: 'Álcool 70% 1L',     quantidade: -4,  unidade: 'un',  hora: '14:22', usuario: 'Michel' },
  { id: 'm2', tipo: 'ENTRADA', itemNome: 'Detergente 500ml',  quantidade: +24, unidade: 'un',  hora: '13:58', usuario: 'Ana'    },
  { id: 'm3', tipo: 'SAIDA',   itemNome: 'Papel Toalha PCT',  quantidade: -6,  unidade: 'pct', hora: '13:41', usuario: 'Carlos' },
  { id: 'm4', tipo: 'SAIDA',   itemNome: 'Luva Nitrílica P',  quantidade: -2,  unidade: 'cx',  hora: '11:30', usuario: 'Michel' },
  { id: 'm5', tipo: 'AJUSTE',  itemNome: 'Água Sanitária 5L', quantidade: -1,  unidade: 'gl',  hora: '10:15', usuario: 'Ana'    },
  { id: 'm6', tipo: 'ENTRADA', itemNome: 'Sabão em Pó 1kg',   quantidade: +12, unidade: 'fd',  hora: '09:05', usuario: 'Carlos' },
]
