import { describe, it, expect } from 'vitest'
import { productSchema, draftSchema } from '@/lib/validations/product'

describe('productSchema', () => {
  const valid = {
    nome: 'Álcool 70%',
    categoryId: 'c1',
    tipoEmbalagem: 'GALAO',
    unidadeConsumo: 'L',
    fatorEmbalagem: 5,
    controlarPor: 'EMBALAGEM',
    ativo: true,
  }

  it('aceita dados válidos completos', () => {
    const result = productSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = productSchema.safeParse({ ...valid, nome: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('nome')
  })

  it('rejeita fatorEmbalagem zero', () => {
    const result = productSchema.safeParse({ ...valid, fatorEmbalagem: 0 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('fatorEmbalagem')
  })

  it('rejeita fatorEmbalagem negativo', () => {
    const result = productSchema.safeParse({ ...valid, fatorEmbalagem: -1 })
    expect(result.success).toBe(false)
  })

  it('aceita codigoInterno vazio (opcional)', () => {
    const result = productSchema.safeParse({ ...valid, codigoInterno: '' })
    expect(result.success).toBe(true)
  })

  it('aceita custoUnitario undefined', () => {
    const result = productSchema.safeParse({ ...valid, custoUnitario: undefined })
    expect(result.success).toBe(true)
  })

  it('rejeita custoUnitario negativo', () => {
    const result = productSchema.safeParse({ ...valid, custoUnitario: -1 })
    expect(result.success).toBe(false)
  })
})

describe('draftSchema', () => {
  it('aceita apenas nome + categoryId + ativo', () => {
    const result = draftSchema.safeParse({ nome: 'Esponja', categoryId: 'c1', ativo: false })
    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = draftSchema.safeParse({ nome: '', categoryId: 'c1', ativo: false })
    expect(result.success).toBe(false)
  })
})
