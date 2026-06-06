import { describe, it, expect } from 'vitest'
import { filterAndSortProducts, paginate } from '@/lib/filter-products'
import type { Product } from '@/types/product'

const products: Product[] = [
  {
    id: 'p1', codigoInterno: '001', nome: 'Álcool 70%', categoryId: 'c1',
    tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'UN', fatorEmbalagem: 1,
    controlarPor: 'EMBALAGEM', ativo: true,
    warehouse: { estoqueAtual: 5, estoqueMinimo: 10 },
    createdAt: '', updatedAt: '',
  },
  {
    id: 'p2', codigoInterno: '002', nome: 'Detergente 500ml', categoryId: 'c1',
    tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'ML', fatorEmbalagem: 500,
    controlarPor: 'EMBALAGEM', ativo: true,
    warehouse: { estoqueAtual: 20, estoqueMinimo: 15 },
    createdAt: '', updatedAt: '',
  },
  {
    id: 'p3', nome: 'Luva Nitrílica P', categoryId: 'c3',
    tipoEmbalagem: 'CAIXA', unidadeConsumo: 'UN', fatorEmbalagem: 100,
    controlarPor: 'EMBALAGEM', ativo: false,
    createdAt: '', updatedAt: '',
  },
]

const defaultState = {
  query: '', categoryId: '', statusFilter: '' as const,
  sortField: 'nome' as const, sortDir: 'asc' as const,
}

describe('filterAndSortProducts', () => {
  it('retorna todos sem filtro', () => {
    expect(filterAndSortProducts(products, defaultState)).toHaveLength(3)
  })

  it('filtra por query no nome', () => {
    const result = filterAndSortProducts(products, { ...defaultState, query: 'álcool' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p1')
  })

  it('filtra por query no codigoInterno', () => {
    const result = filterAndSortProducts(products, { ...defaultState, query: '002' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p2')
  })

  it('filtra por categoryId', () => {
    const result = filterAndSortProducts(products, { ...defaultState, categoryId: 'c3' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p3')
  })

  it('filtra por status rascunho', () => {
    const result = filterAndSortProducts(products, { ...defaultState, statusFilter: 'rascunho' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p3')
  })

  it('ordena por nome asc', () => {
    const result = filterAndSortProducts(products, defaultState)
    expect(result[0].nome).toBe('Álcool 70%')
    expect(result[1].nome).toBe('Detergente 500ml')
  })

  it('ordena por nome desc', () => {
    const result = filterAndSortProducts(products, { ...defaultState, sortDir: 'desc' })
    expect(result[0].nome).toBe('Luva Nitrílica P')
  })
})

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('retorna primeira página', () => {
    expect(paginate(items, 1, 3)).toEqual([1, 2, 3])
  })

  it('retorna segunda página', () => {
    expect(paginate(items, 2, 3)).toEqual([4, 5, 6])
  })

  it('retorna última página parcial', () => {
    expect(paginate(items, 4, 3)).toEqual([10])
  })

  it('retorna tudo em página única', () => {
    expect(paginate(items, 1, 50)).toEqual(items)
  })
})
