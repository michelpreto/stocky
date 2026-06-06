// components/operator/ConfirmationScreen.tsx
'use client'

import { useEffect } from 'react'
import { Check } from 'lucide-react'
import type { BaixaInput, SearchResult } from '@/types/operator'

interface Props {
  baixa: BaixaInput
  produto: SearchResult
  setorNome: string
  onComplete: () => void
}

export function ConfirmationScreen({ baixa, produto, setorNome, onComplete }: Props) {
  useEffect(() => {
    try { navigator.vibrate([100, 50, 100]) } catch {}
    const timer = setTimeout(onComplete, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  const saldoRestante = produto.estoqueAtual - baixa.quantidade

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4 px-6"
      aria-live="polite"
      aria-label={`Baixa registrada: ${produto.nome}, ${baixa.quantidade} ${baixa.unidade}`}
    >
      <div
        className="w-16 h-16 rounded-full bg-success flex items-center justify-center"
        style={{ boxShadow: '0 0 32px hsl(var(--color-success)/0.5)' }}
      >
        <Check size={32} className="text-white" strokeWidth={3} />
      </div>

      <p className="text-xl font-black text-success">Baixa registrada!</p>

      <div className="w-full max-w-xs bg-card border border-success/20 rounded-2xl px-5 py-4 flex flex-col gap-2">
        <Row label="Item"           value={produto.nome} />
        <Row label="Quantidade"     value={`−${baixa.quantidade} ${baixa.unidade}`} valueClass="text-danger" />
        <Row label="Setor"          value={setorNome} />
        <Row label="Saldo restante" value={`${saldoRestante} ${produto.unidade}`}   valueClass="text-success" />
      </div>

      <p className="text-xs text-muted-foreground">Voltando à busca em 2s...</p>
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold font-mono text-foreground ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
