// lib/mock-data/products.ts
import type { Category, Product } from '@/types/product'

export const mockCategories: Category[] = [
  { id: 'c1', nome: 'Limpeza',      cor: '#3B82F6' },
  { id: 'c2', nome: 'Copa',         cor: '#22C55E' },
  { id: 'c3', nome: 'EPI',          cor: '#F59E0B' },
  { id: 'c4', nome: 'Descartáveis', cor: '#A855F7' },
  { id: 'c5', nome: 'Ferramentas',  cor: '#64748B' },
]

export const mockProducts: Product[] = [
  {
    id: 'p1', codigoInterno: '00034', nome: 'Álcool 70% 1L Talge',
    codigoBarras: '7891082036424', categoryId: 'c1',
    category: mockCategories[0],
    tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'UN', fatorEmbalagem: 1,
    controlarPor: 'EMBALAGEM', custoUnitario: 4.50, ativo: true,
    warehouse: { estoqueAtual: 8, estoqueMinimo: 20 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p2', codigoInterno: '00041', nome: 'Água Sanitária 5L Talge',
    categoryId: 'c1', category: mockCategories[0],
    tipoEmbalagem: 'GALAO', unidadeConsumo: 'L',
    fatorEmbalagem: 5, controlarPor: 'EMBALAGEM', custoUnitario: 12.80, ativo: true,
    warehouse: { estoqueAtual: 2, estoqueMinimo: 8 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p3', codigoInterno: '00078', nome: 'Luva Nitrílica P',
    categoryId: 'c3', category: mockCategories[2],
    tipoEmbalagem: 'CAIXA', unidadeConsumo: 'UN',
    fatorEmbalagem: 100, controlarPor: 'EMBALAGEM', custoUnitario: 89.00, ativo: true,
    warehouse: { estoqueAtual: 1, estoqueMinimo: 6 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p4', codigoInterno: '00092', nome: 'Papel Toalha PCT c/2',
    categoryId: 'c1', category: mockCategories[0],
    tipoEmbalagem: 'PACOTE', unidadeConsumo: 'UN',
    fatorEmbalagem: 2, controlarPor: 'EMBALAGEM', custoUnitario: 6.20, ativo: true,
    warehouse: { estoqueAtual: 4, estoqueMinimo: 12 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p5', nome: 'Esponja de Aço',
    categoryId: 'c1', category: mockCategories[0],
    tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'UN',
    fatorEmbalagem: 1, controlarPor: 'EMBALAGEM', ativo: false,
    createdAt: '2026-06-05T10:00:00Z', updatedAt: '2026-06-05T10:00:00Z',
  },
  {
    id: 'p6', codigoInterno: '00015', nome: 'Detergente 500ml',
    categoryId: 'c1', category: mockCategories[0],
    tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'ML',
    fatorEmbalagem: 500, controlarPor: 'EMBALAGEM', custoUnitario: 2.90, ativo: true,
    warehouse: { estoqueAtual: 12, estoqueMinimo: 15 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
  {
    id: 'p7', codigoInterno: '00023', nome: 'Sabão em Pó 1kg',
    categoryId: 'c1', category: mockCategories[0],
    tipoEmbalagem: 'FARDO', unidadeConsumo: 'KG',
    fatorEmbalagem: 10, controlarPor: 'EMBALAGEM', custoUnitario: 8.50, ativo: true,
    warehouse: { estoqueAtual: 25, estoqueMinimo: 10 },
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-05T14:00:00Z',
  },
]
