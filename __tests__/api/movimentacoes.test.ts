import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    productWarehouse: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (fn: Function) => fn({
      productWarehouse: {
        findUnique: vi.fn().mockResolvedValue({
          productId:     'prod-1',
          warehouseId:   'wh-1',
          estoqueAtual:  10,
          estoqueMinimo: 5,
        }),
        update: vi.fn(),
      },
      stockMovement: {
        create: vi.fn().mockResolvedValue({
          id:            'mov-1',
          tipo:          'SAIDA',
          quantidade:    -3,
          estoqueAntes:  10,
          estoqueDepois: 7,
        }),
      },
    })),
  },
}))

import { auth } from '@/auth'
import { POST } from '@/app/api/movimentacoes/route'

const mockAuth = auth as ReturnType<typeof vi.fn>

describe('POST /api/movimentacoes', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', organizationId: 'org-1' },
    })
  })

  it('retorna 401 sem sessão', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ productId: 'p1', warehouseId: 'w1', tipo: 'SAIDA', quantidade: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('retorna 400 com quantidade zero', async () => {
    const req = new Request('http://localhost/api/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ productId: 'p1', warehouseId: 'w1', tipo: 'SAIDA', quantidade: 0 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 com payload inválido (tipo errado)', async () => {
    const req = new Request('http://localhost/api/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ productId: 'p1', warehouseId: 'w1', tipo: 'INVALIDO', quantidade: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 201 com movimento criado para SAIDA válida', async () => {
    const req = new Request('http://localhost/api/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ productId: 'clh4xfr0w0000qhjz2rl0bvx4', warehouseId: 'wh-1', tipo: 'SAIDA', quantidade: 3 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.tipo).toBe('SAIDA')
  })
})
