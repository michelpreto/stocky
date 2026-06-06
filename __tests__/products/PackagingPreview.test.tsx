import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PackagingPreview } from '@/components/products/PackagingPreview'

describe('PackagingPreview', () => {
  it('exibe 1 GALÃO = 5 L', () => {
    render(<PackagingPreview tipoEmbalagem="GALAO" fatorEmbalagem={5} unidadeConsumo="L" />)
    expect(screen.getByText('1 GALÃO = 5 L')).toBeInTheDocument()
  })

  it('exibe código GL-5L', () => {
    render(<PackagingPreview tipoEmbalagem="GALAO" fatorEmbalagem={5} unidadeConsumo="L" />)
    expect(screen.getByText('GL-5L')).toBeInTheDocument()
  })

  it('exibe exemplo de entrada corretamente', () => {
    render(<PackagingPreview tipoEmbalagem="GALAO" fatorEmbalagem={5} unidadeConsumo="L" />)
    expect(screen.getByText(/Entrada de 12 galões → \+60 L/)).toBeInTheDocument()
  })

  it('exibe exemplo de baixa corretamente', () => {
    render(<PackagingPreview tipoEmbalagem="GALAO" fatorEmbalagem={5} unidadeConsumo="L" />)
    expect(screen.getByText(/Baixa de 2 galões → −10 L/)).toBeInTheDocument()
  })

  it('exibe FD-10KG para fardo 10 kg', () => {
    render(<PackagingPreview tipoEmbalagem="FARDO" fatorEmbalagem={10} unidadeConsumo="KG" />)
    expect(screen.getByText('FD-10KG')).toBeInTheDocument()
    expect(screen.getByText('1 FARDO = 10 KG')).toBeInTheDocument()
  })
})
