// components/operator/RecentList.tsx
'use client'

import { useState, useEffect } from 'react'
import type { RecentBaixa } from '@/types/operator'

function Countdown({ expiresAt, onExpire }: { expiresAt: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return }
    const id = setInterval(() => {
      const secs = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setRemaining(secs)
      if (secs <= 0) { clearInterval(id); onExpire() }
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpire, remaining])

  if (remaining <= 0) return null
  return <span className="text-xs text-muted-foreground ml-1">{remaining}s</span>
}

interface Props {
  items: RecentBaixa[]
  onUndo: (id: string) => void
}

export function RecentList({ items, onUndo }: Props) {
  const [expired, setExpired] = useState<Set<string>>(new Set())

  if (items.length === 0) return null

  const markExpired = (id: string) => setExpired((prev) => new Set([...prev, id]))

  return (
    <div className="px-3 pt-3 pb-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
        Últimas baixas hoje
      </p>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => {
          const canUndo = item.expiresAt > Date.now() && !expired.has(item.id)
          return (
            <div
              key={item.id}
              className="flex items-center justify-between border-l-2 border-success bg-success/5 rounded-r-lg px-3 py-2 min-h-[44px]"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{item.produtoNome}</p>
                <p className="text-[10px] text-muted-foreground">
                  −{item.quantidade} {item.unidade} · {item.hora}
                </p>
              </div>
              {canUndo && (
                <button
                  onClick={() => onUndo(item.id)}
                  className="flex items-center ml-2 text-xs font-bold text-primary bg-primary/10 border border-primary/30 rounded-lg px-2 py-1 flex-shrink-0"
                  style={{ touchAction: 'manipulation', minHeight: 44 }}
                >
                  Desfazer
                  <Countdown expiresAt={item.expiresAt} onExpire={() => markExpired(item.id)} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
