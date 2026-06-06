// __tests__/components/KpiCard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { TrendingUp } from 'lucide-react'

describe('KpiCard', () => {
  it('renderiza label e valor formatado', () => {
    render(
      <KpiCard
        label="Valor em estoque"
        value="R$ 42.830,00"
        delta={{ text: '↑ +12,4%', color: 'text-success' }}
        icon={<TrendingUp size={14} />}
      />
    )
    expect(screen.getByText('Valor em estoque')).toBeInTheDocument()
    expect(screen.getByText('R$ 42.830,00')).toBeInTheDocument()
    expect(screen.getByText('↑ +12,4%')).toBeInTheDocument()
  })

  it('renderiza delta com classe de cor correta', () => {
    render(
      <KpiCard
        label="Abaixo do mínimo"
        value="14"
        delta={{ text: '↓ +3', color: 'text-danger' }}
        icon={<TrendingUp size={14} />}
      />
    )
    const deltaEl = screen.getByText('↓ +3')
    expect(deltaEl).toHaveClass('text-danger')
  })
})
