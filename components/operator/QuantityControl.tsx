// components/operator/QuantityControl.tsx
'use client'

const SHORTCUTS = [1, 5, 10]

interface Props {
  value: number
  max: number
  onChange: (v: number) => void
}

export function QuantityControl({ value, max, onChange }: Props) {
  const decrement = () => { if (value > 1) onChange(value - 1) }
  const increment = () => { if (value < max) onChange(value + 1) }
  const setShortcut = (n: number) => onChange(Math.min(n, max))

  return (
    <div>
      {/* ± row */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          onClick={decrement}
          disabled={value <= 1}
          className="w-11 h-11 bg-surface-elevated border border-border rounded-xl flex items-center justify-center text-xl font-bold text-foreground disabled:opacity-30 transition-opacity"
          style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
        >
          −
        </button>

        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={1}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v) && v >= 1 && v <= max) onChange(v)
          }}
          className="flex-1 h-11 bg-surface-elevated border-2 border-primary rounded-xl text-center font-mono text-2xl font-black text-foreground outline-none"
          style={{ touchAction: 'manipulation' }}
        />

        <button
          type="button"
          aria-label="Aumentar quantidade"
          onClick={increment}
          disabled={value >= max}
          className="w-11 h-11 bg-surface-elevated border border-border rounded-xl flex items-center justify-center text-xl font-bold text-foreground disabled:opacity-30 transition-opacity"
          style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
        >
          +
        </button>
      </div>

      {/* Shortcuts */}
      <div className="flex gap-2">
        {SHORTCUTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setShortcut(n)}
            className="flex-1 h-11 bg-surface-elevated border border-border rounded-xl text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            style={{ touchAction: 'manipulation', minHeight: 44 }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
