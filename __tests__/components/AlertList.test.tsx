// __tests__/components/AlertList.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AlertList } from '@/components/dashboard/AlertList'
import type { AlertItem } from '@/types/dashboard'

const mockAlerts: AlertItem[] = [
  { id: '1', severidade: 'CRITICO', mensagem: 'Álcool 70% zerado',          meta: 'Estoque: 0 un' },
  { id: '2', severidade: 'ALERTA',  mensagem: 'Detergente — reposição',     meta: 'Estoque: 12 un' },
  { id: '3', severidade: 'INFO',    mensagem: 'Inventário vence em 5 dias', meta: 'Ciclo mensal' },
]

describe('AlertList', () => {
  it('renderiza todos os alertas', () => {
    render(<AlertList alerts={mockAlerts} />)
    expect(screen.getByText('Álcool 70% zerado')).toBeInTheDocument()
    expect(screen.getByText('Detergente — reposição')).toBeInTheDocument()
    expect(screen.getByText('Inventário vence em 5 dias')).toBeInTheDocument()
  })

  it('mostra contagem de críticos no header', () => {
    render(<AlertList alerts={mockAlerts} />)
    expect(screen.getByText('1 crítico')).toBeInTheDocument()
  })

  it('renderiza estado vazio quando não há alertas', () => {
    render(<AlertList alerts={[]} />)
    expect(screen.getByText('Tudo em ordem')).toBeInTheDocument()
  })
})
