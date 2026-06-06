// components/operator/SearchField.tsx
'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (v: string) => void
  isOffline?: boolean
  autoFocus?: boolean
}

export function SearchField({ value, onChange, isOffline = false, autoFocus = true }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 bg-surface-elevated border-2 rounded-xl px-3 py-3 min-h-[48px] transition-colors',
        isOffline
          ? 'border-warning shadow-[0_0_0_3px_hsl(var(--color-warning)/0.15)]'
          : 'border-primary shadow-[0_0_0_3px_hsl(var(--color-primary)/0.12)]'
      )}
    >
      <Search size={16} className="text-muted-foreground flex-shrink-0" />
      <input
        role="searchbox"
        type="search"
        inputMode="search"
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Buscar item ou código de barras..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
        style={{ touchAction: 'manipulation' }}
      />
    </div>
  )
}
