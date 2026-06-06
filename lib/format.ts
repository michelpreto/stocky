// lib/format.ts

const ptBR = 'pt-BR'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(ptBR, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value).replace(' ', ' ')
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(ptBR).format(value)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(ptBR, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(ptBR, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

type DeltaDirection = 'up' | 'down' | 'neutral'

export function formatDelta(
  value: number,
  direction: DeltaDirection,
  suffix?: string
): { text: string; color: string } {
  if (direction === 'neutral') {
    return { text: '— mesmo nível', color: 'text-muted-foreground' }
  }
  const arrow = direction === 'up' ? '↑' : '↓'
  const formatted = value % 1 !== 0
    ? `+${value.toLocaleString(ptBR, { maximumFractionDigits: 1 })}%`
    : `+${value}`
  return {
    text: `${arrow} ${formatted}${suffix ? ` ${suffix}` : ''}`,
    color: direction === 'up' ? 'text-success' : 'text-danger',
  }
}
