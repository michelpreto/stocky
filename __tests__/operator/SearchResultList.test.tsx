// __tests__/operator/SearchResultList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchResultList } from '@/components/operator/SearchResultList'
import type { SearchResult } from '@/types/operator'

const results: SearchResult[] = [
  { id: 'p1', nome: 'Álcool 70% 1L', codigoInterno: '00034', categoria: 'Limpeza', unidade: 'un', estoqueAtual: 8,  estoqueMinimo: 20 },
  { id: 'p2', nome: 'Detergente',     codigoInterno: '00041', categoria: 'Limpeza', unidade: 'un', estoqueAtual: 12, estoqueMinimo: 15 },
  { id: 'p3', nome: 'Luva P',         codigoInterno: '00078', categoria: 'EPI',     unidade: 'cx', estoqueAtual: 0,  estoqueMinimo: 6  },
]

describe('SearchResultList', () => {
  it('renderiza todos os resultados', () => {
    render(<SearchResultList results={results} onSelect={vi.fn()} />)
    expect(screen.getByText('Álcool 70% 1L')).toBeInTheDocument()
    expect(screen.getByText('Detergente')).toBeInTheDocument()
    expect(screen.getByText('Luva P')).toBeInTheDocument()
  })

  it('chama onSelect ao clicar em um item', () => {
    const onSelect = vi.fn()
    render(<SearchResultList results={results} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Álcool 70% 1L'))
    expect(onSelect).toHaveBeenCalledWith(results[0])
  })

  it('exibe estoque em vermelho quando zerado', () => {
    render(<SearchResultList results={results} onSelect={vi.fn()} />)
    const zeroStock = screen.getByText('0 cx')
    expect(zeroStock).toHaveClass('text-danger')
  })

  it('exibe estado vazio quando sem resultados e com query', () => {
    render(<SearchResultList results={[]} onSelect={vi.fn()} query="xyz" />)
    expect(screen.getByText(/nenhum item encontrado/i)).toBeInTheDocument()
  })

  it('não exibe nada quando sem resultados e sem query', () => {
    const { container } = render(<SearchResultList results={[]} onSelect={vi.fn()} query="" />)
    expect(container.firstChild).toBeNull()
  })
})
