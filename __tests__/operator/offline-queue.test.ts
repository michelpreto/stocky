// __tests__/operator/offline-queue.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { enqueue, dequeue, getAll, clearQueue } from '@/lib/offline-queue'
import type { BaixaInput } from '@/types/operator'

const sampleBaixa: BaixaInput = {
  produtoId: 'p1',
  quantidade: 3,
  unidade: 'un',
  setorId: 's1',
  motivo: 'CONSUMO_ROTINEIRO',
}

describe('offline-queue', () => {
  beforeEach(() => {
    localStorage.clear()
    clearQueue()
  })

  it('enqueue adiciona item com id único e timestamp', () => {
    const id = enqueue(sampleBaixa)
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('getAll retorna itens na ordem de inserção', () => {
    enqueue(sampleBaixa)
    enqueue({ ...sampleBaixa, produtoId: 'p2' })
    const all = getAll()
    expect(all).toHaveLength(2)
    expect(all[0].data.produtoId).toBe('p1')
    expect(all[1].data.produtoId).toBe('p2')
  })

  it('dequeue remove item por id', () => {
    const id = enqueue(sampleBaixa)
    dequeue(id)
    expect(getAll()).toHaveLength(0)
  })

  it('dequeue de id inexistente não lança erro', () => {
    expect(() => dequeue('nao-existe')).not.toThrow()
  })

  it('fila persiste entre chamadas (simula sessão)', () => {
    enqueue(sampleBaixa)
    const all = getAll()
    expect(all).toHaveLength(1)
  })
})
