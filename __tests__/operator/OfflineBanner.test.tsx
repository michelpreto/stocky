// __tests__/operator/OfflineBanner.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OfflineBanner } from '@/components/operator/OfflineBanner'

describe('OfflineBanner', () => {
  it('não renderiza nada quando online', () => {
    render(<OfflineBanner isOnline={true} pendingCount={0} />)
    expect(screen.queryByText(/offline/i)).toBeNull()
  })

  it('renderiza banner quando offline', () => {
    render(<OfflineBanner isOnline={false} pendingCount={0} />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  it('mostra contagem de baixas pendentes', () => {
    render(<OfflineBanner isOnline={false} pendingCount={3} />)
    expect(screen.getByText(/3 baixas/i)).toBeInTheDocument()
  })

  it('não mostra contagem quando zero pendentes', () => {
    render(<OfflineBanner isOnline={false} pendingCount={0} />)
    expect(screen.queryByText(/baixas/i)).toBeNull()
  })
})
