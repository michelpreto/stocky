import { describe, it, expect } from 'vitest'
import {
  getStockStatus,
  gerarDescricaoEmbalagem,
} from '@/types/product'
import type { Product, TipoEmbalagem, UnidadeConsumo } from '@/types/product'

const base: Product = {
  id: 'p1',
  nome: 'Álcool 70%',
  categoryId: 'c1',
  tipoEmbalagem: 'UNIDADE',
  unidadeConsumo: 'UN',
  fatorEmbalagem: 1,
  controlarPor: 'EMBALAGEM',
  ativo: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('getStockStatus', () => {
  it('retorna rascunho quando ativo=false', () => {
    expect(getStockStatus({ ...base, ativo: false })).toBe('rascunho')
  })
  it('retorna rascunho quando sem codigoInterno', () => {
    expect(getStockStatus({ ...base, codigoInterno: undefined })).toBe('rascunho')
  })
  it('retorna rascunho quando sem warehouse', () => {
    expect(getStockStatus({ ...base, codigoInterno: '001' })).toBe('rascunho')
  })
  it('retorna zerado quando estoqueAtual = 0', () => {
    expect(getStockStatus({
      ...base, codigoInterno: '001',
      warehouse: { estoqueAtual: 0, estoqueMinimo: 10 },
    })).toBe('zerado')
  })
  it('retorna critico quando estoqueAtual < estoqueMinimo * 0.5', () => {
    expect(getStockStatus({
      ...base, codigoInterno: '001',
      warehouse: { estoqueAtual: 2, estoqueMinimo: 10 },
    })).toBe('critico')
  })
  it('retorna baixo quando estoqueAtual entre 50% e 100% do mínimo', () => {
    expect(getStockStatus({
      ...base, codigoInterno: '001',
      warehouse: { estoqueAtual: 6, estoqueMinimo: 10 },
    })).toBe('baixo')
  })
  it('retorna normal quando estoqueAtual >= estoqueMinimo', () => {
    expect(getStockStatus({
      ...base, codigoInterno: '001',
      warehouse: { estoqueAtual: 10, estoqueMinimo: 10 },
    })).toBe('normal')
  })
})

describe('gerarDescricaoEmbalagem', () => {
  it('gera código GL-5L para galão 5 litros', () => {
    expect(gerarDescricaoEmbalagem('GALAO', 5, 'L')).toBe('GL-5L')
  })
  it('gera código FD-10KG para fardo 10 kg', () => {
    expect(gerarDescricaoEmbalagem('FARDO', 10, 'KG')).toBe('FD-10KG')
  })
  it('gera código CX-100UN para caixa 100 unidades', () => {
    expect(gerarDescricaoEmbalagem('CAIXA', 100, 'UN')).toBe('CX-100UN')
  })
  it('gera código PCT-100UN para pacote 100 unidades', () => {
    expect(gerarDescricaoEmbalagem('PACOTE', 100, 'UN')).toBe('PCT-100UN')
  })
})
