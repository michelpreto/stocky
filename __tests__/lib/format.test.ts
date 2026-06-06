// __tests__/lib/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber, formatDate, formatTime, formatDelta } from '@/lib/format'

describe('formatCurrency', () => {
  it('formata valor com R$, ponto de milhar e vírgula decimal', () => {
    expect(formatCurrency(42830)).toBe('R$ 42.830,00')
  })
  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
  it('formata valor com centavos', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
  })
})

describe('formatNumber', () => {
  it('formata número com ponto de milhar', () => {
    expect(formatNumber(1234)).toBe('1.234')
  })
  it('formata número simples', () => {
    expect(formatNumber(38)).toBe('38')
  })
})

describe('formatDate', () => {
  it('formata data em dd/mm/aaaa', () => {
    expect(formatDate(new Date('2026-06-05T12:00:00'))).toBe('05/06/2026')
  })
})

describe('formatTime', () => {
  it('formata hora em HH:mm', () => {
    expect(formatTime(new Date('2026-06-05T14:22:00'))).toBe('14:22')
  })
})

describe('formatDelta', () => {
  it('retorna string com seta para cima e cor green para positivo', () => {
    const result = formatDelta(12.4, 'up')
    expect(result.text).toBe('↑ +12,4%')
    expect(result.color).toBe('text-success')
  })
  it('retorna seta para baixo e cor danger para negativo', () => {
    const result = formatDelta(3, 'down')
    expect(result.text).toBe('↓ +3')
    expect(result.color).toBe('text-danger')
  })
  it('retorna traço e cor muted para neutro', () => {
    const result = formatDelta(0, 'neutral')
    expect(result.text).toBe('— mesmo nível')
    expect(result.color).toBe('text-muted-foreground')
  })
})
