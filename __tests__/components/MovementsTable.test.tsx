// __tests__/components/MovementsTable.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MovementsTable } from '@/components/dashboard/MovementsTable'
import type { MovementRow } from '@/types/dashboard'

const rows: MovementRow[] = [
  { id: '1', tipo: 'ENTRADA', itemNome: 'Detergente 500ml', quantidade: 24,  unidade: 'un', hora: '13:58', usuario: 'Ana'    },
  { id: '2', tipo: 'SAIDA',   itemNome: 'Álcool 70% 1L',   quantidade: -4,  unidade: 'un', hora: '14:22', usuario: 'Michel' },
  { id: '3', tipo: 'AJUSTE',  itemNome: 'Água Sanitária',  quantidade: -1,  unidade: 'gl', hora: '10:15', usuario: 'Ana'    },
]

describe('MovementsTable', () => {
  it('renderiza todas as linhas', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('Detergente 500ml')).toBeInTheDocument()
    expect(screen.getByText('Álcool 70% 1L')).toBeInTheDocument()
    expect(screen.getByText('Água Sanitária')).toBeInTheDocument()
  })

  it('badge de ENTRADA tem texto correto', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('↑ Entrada')).toBeInTheDocument()
  })

  it('badge de SAIDA tem texto correto', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('↓ Saída')).toBeInTheDocument()
  })

  it('formata quantidade positiva com +', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('+24 un')).toBeInTheDocument()
  })

  it('formata quantidade negativa com −', () => {
    render(<MovementsTable movements={rows} />)
    expect(screen.getByText('−4 un')).toBeInTheDocument()
  })
})
