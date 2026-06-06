// __tests__/operator/BaixaModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BaixaModal } from '@/components/operator/BaixaModal'
import type { SearchResult } from '@/types/operator'
import { mockSetores } from '@/lib/mock-data/operator'

const item: SearchResult = {
  id: 'p1',
  nome: 'Álcool 70% 1L',
  codigoInterno: '00034',
  categoria: 'Limpeza',
  unidade: 'un',
  estoqueAtual: 8,
  estoqueMinimo: 20,
}

describe('BaixaModal', () => {
  it('não renderiza quando item é null', () => {
    const { container } = render(
      <BaixaModal item={null} setores={mockSetores} onClose={vi.fn()} onConfirm={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('exibe nome e código do produto', () => {
    render(<BaixaModal item={item} setores={mockSetores} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByText('Álcool 70% 1L')).toBeInTheDocument()
    expect(screen.getByText(/00034/)).toBeInTheDocument()
  })

  it('exibe estoque atual em destaque', () => {
    render(<BaixaModal item={item} setores={mockSetores} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('chama onClose ao clicar em Cancelar', () => {
    const onClose = vi.fn()
    render(<BaixaModal item={item} setores={mockSetores} onClose={onClose} onConfirm={vi.fn()} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalled()
  })

  it('chama onConfirm com dados corretos ao confirmar', () => {
    const onConfirm = vi.fn()
    render(<BaixaModal item={item} setores={mockSetores} onClose={vi.fn()} onConfirm={onConfirm} />)
    fireEvent.change(screen.getByLabelText('Setor solicitante'), { target: { value: 's1' } })
    fireEvent.click(screen.getByText(/confirmar baixa/i))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        produtoId: 'p1',
        unidade: 'un',
        setorId: 's1',
        motivo: 'CONSUMO_ROTINEIRO',
      })
    )
  })

  it('bloqueia confirmação sem setor selecionado', () => {
    const onConfirm = vi.fn()
    render(<BaixaModal item={item} setores={mockSetores} onClose={vi.fn()} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText(/confirmar baixa/i))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText(/setor obrigatório/i)).toBeInTheDocument()
  })
})
