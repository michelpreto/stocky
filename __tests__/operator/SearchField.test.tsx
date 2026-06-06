// __tests__/operator/SearchField.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchField } from '@/components/operator/SearchField'

describe('SearchField', () => {
  it('renderiza campo de busca', () => {
    render(<SearchField value="" onChange={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('chama onChange com o valor digitado', () => {
    const onChange = vi.fn()
    render(<SearchField value="" onChange={onChange} />)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'alcool' } })
    expect(onChange).toHaveBeenCalledWith('alcool')
  })

  it('exibe placeholder correto', () => {
    render(<SearchField value="" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText(/buscar item ou código/i)).toBeInTheDocument()
  })

  it('aplica classe de borda offline quando isOffline=true', () => {
    render(<SearchField value="" onChange={vi.fn()} isOffline={true} />)
    const input = screen.getByRole('searchbox')
    expect(input.closest('div')).toHaveClass('border-warning')
  })
})
