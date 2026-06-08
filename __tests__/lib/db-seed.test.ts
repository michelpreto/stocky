import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'

function toSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

describe('seed utilities', () => {
  it('gera hash de senha válido', async () => {
    const hash = await bcrypt.hash('Admin@2026', 12)
    expect(await bcrypt.compare('Admin@2026', hash)).toBe(true)
    expect(await bcrypt.compare('senha-errada', hash)).toBe(false)
  })

  it('rejeita senha incorreta', async () => {
    const hash = await bcrypt.hash('Admin@2026', 12)
    const result = await bcrypt.compare('errada', hash)
    expect(result).toBe(false)
  })

  it('gera slug a partir do nome da organização', () => {
    expect(toSlug('Minha Empresa')).toBe('minha-empresa')
    expect(toSlug('AlmoxControl')).toBe('almoxcontrol')
  })

  it('slug remove acentos', () => {
    expect(toSlug('Álcool & Cia')).toBe('alcool--cia')
  })
})
