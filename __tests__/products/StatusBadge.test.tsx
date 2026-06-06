import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge } from '@/components/products/StatusBadge'

describe('StatusBadge', () => {
  it('exibe "Normal" para status normal', () => {
    render(<StatusBadge status="normal" />)
    expect(screen.getByText('Normal')).toBeInTheDocument()
  })
  it('exibe "Baixo" para status baixo', () => {
    render(<StatusBadge status="baixo" />)
    expect(screen.getByText('Baixo')).toBeInTheDocument()
  })
  it('exibe "Crítico" para status critico', () => {
    render(<StatusBadge status="critico" />)
    expect(screen.getByText('Crítico')).toBeInTheDocument()
  })
  it('exibe "Zerado" para status zerado', () => {
    render(<StatusBadge status="zerado" />)
    expect(screen.getByText('Zerado')).toBeInTheDocument()
  })
  it('exibe "Rascunho" para status rascunho', () => {
    render(<StatusBadge status="rascunho" />)
    expect(screen.getByText('Rascunho')).toBeInTheDocument()
  })
})
