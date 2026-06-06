// lib/mock-data/operator.ts
import type { SearchResult, Setor, RecentBaixa } from '@/types/operator'

export const mockSearchResults: SearchResult[] = [
  {
    id: 'p1',
    nome: 'Álcool 70% 1L Talge',
    codigoInterno: '00034',
    codigoBarras: '7891082036424',
    categoria: 'Limpeza',
    unidade: 'un',
    estoqueAtual: 8,
    estoqueMinimo: 20,
  },
  {
    id: 'p2',
    nome: 'Álcool Gel 70% 500g',
    codigoInterno: '00035',
    categoria: 'Limpeza',
    unidade: 'un',
    estoqueAtual: 3,
    estoqueMinimo: 10,
  },
  {
    id: 'p3',
    nome: 'Detergente 500ml',
    codigoInterno: '00041',
    categoria: 'Limpeza',
    unidade: 'un',
    estoqueAtual: 12,
    estoqueMinimo: 15,
  },
  {
    id: 'p4',
    nome: 'Luva Nitrílica P',
    codigoInterno: '00078',
    categoria: 'EPI',
    unidade: 'cx',
    estoqueAtual: 1,
    estoqueMinimo: 6,
  },
  {
    id: 'p5',
    nome: 'Papel Toalha PCT',
    codigoInterno: '00092',
    categoria: 'Limpeza',
    unidade: 'pct',
    estoqueAtual: 4,
    estoqueMinimo: 12,
  },
]

export const mockSetores: Setor[] = [
  { id: 's1', nome: 'Copa / Limpeza',  usageCount: 48 },
  { id: 's2', nome: 'Recepção',        usageCount: 12 },
  { id: 's3', nome: 'Manutenção',      usageCount: 8  },
  { id: 's4', nome: 'Administrativo',  usageCount: 5  },
]

export const mockRecentBaixas: RecentBaixa[] = [
  {
    id: 'b1',
    produtoNome: 'Luva Nitrílica P',
    quantidade: 2,
    unidade: 'cx',
    hora: '14:22',
    expiresAt: Date.now() + 43_000,
    synced: true,
  },
  {
    id: 'b2',
    produtoNome: 'Papel Toalha PCT',
    quantidade: 6,
    unidade: 'pct',
    hora: '13:41',
    expiresAt: Date.now() - 1,
    synced: true,
  },
]
