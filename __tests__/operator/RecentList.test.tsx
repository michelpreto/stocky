// __tests__/operator/RecentList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RecentList } from '@/components/operator/RecentList'
import type { RecentBaixa } from '@/types/operator'

const now = Date.now()

const items: RecentBaixa[] = [
  { id: 'b1', produtoNome: 'Álcool 70% 1L', quantidade: 3, unidade: 'un',  hora: '14:22', expiresAt: now + 30_000, synced: true  },
  { id: 'b2', produtoNome: 'Luva Nitrílica', quantidade: 2, unidade: 'cx',  hora: '13:41', expiresAt: now - 1,      synced: true  },
]

describe('RecentList', () => {
  it('renderiza lista de baixas', () => {
    render(<RecentList items={items} onUndo={vi.fn()} />)
    expect(screen.getByText('Álcool 70% 1L')).toBeInTheDocument()
    expect(screen.getByText('Luva Nitrílica')).toBeInTheDocument()
  })

  it('exibe botão desfazer apenas para baixas dentro do prazo', () => {
    render(<RecentList items={items} onUndo={vi.fn()} />)
    expect(screen.getByText(/desfazer/i)).toBeInTheDocument()
  })

  it('não exibe botão desfazer para baixas expiradas', () => {
    const expired: RecentBaixa[] = [
      { id: 'b2', produtoNome: 'Luva', quantidade: 2, unidade: 'cx', hora: '13:41', expiresAt: now - 1, synced: true },
    ]
    render(<RecentList items={expired} onUndo={vi.fn()} />)
    expect(screen.queryByText(/desfazer/i)).toBeNull()
  })

  it('chama onUndo com id ao clicar em Desfazer', () => {
    const onUndo = vi.fn()
    render(<RecentList items={items} onUndo={onUndo} />)
    fireEvent.click(screen.getByText(/desfazer/i))
    expect(onUndo).toHaveBeenCalledWith('b1')
  })

  it('não renderiza nada quando lista vazia', () => {
    const { container } = render(<RecentList items={[]} onUndo={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })
})
