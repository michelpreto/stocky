// __tests__/operator/QuantityControl.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuantityControl } from '@/components/operator/QuantityControl'

describe('QuantityControl', () => {
  it('renderiza valor inicial', () => {
    render(<QuantityControl value={3} max={10} onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })

  it('incrementa ao clicar em +', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={3} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Aumentar quantidade'))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('decrementa ao clicar em −', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={3} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Diminuir quantidade'))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('não decrementa abaixo de 1', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={1} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Diminuir quantidade'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('não incrementa acima do max', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={10} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Aumentar quantidade'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('atalho define valor diretamente', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={1} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByText('5'))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('atalho não ultrapassa o max', () => {
    const onChange = vi.fn()
    render(<QuantityControl value={1} max={3} onChange={onChange} />)
    fireEvent.click(screen.getByText('5'))
    expect(onChange).toHaveBeenCalledWith(3)
  })
})
