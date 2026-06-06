// components/operator/BaixaModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuantityControl } from './QuantityControl'
import type { SearchResult, BaixaInput, MotivoType, Setor } from '@/types/operator'

const MOTIVOS: { value: MotivoType; label: string }[] = [
  { value: 'CONSUMO_ROTINEIRO', label: 'Consumo rotineiro' },
  { value: 'QUEBRA',            label: 'Quebra / Perda' },
  { value: 'VENCIMENTO',        label: 'Vencimento' },
  { value: 'OUTRO',             label: 'Outro' },
]

interface Props {
  item: SearchResult | null
  setores: Setor[]
  onClose: () => void
  onConfirm: (baixa: BaixaInput) => void
}

export function BaixaModal({ item, setores, onClose, onConfirm }: Props) {
  const [quantidade, setQuantidade] = useState(1)
  const [setorId, setSetorId] = useState('')
  const [motivo, setMotivo] = useState<MotivoType>('CONSUMO_ROTINEIRO')
  const [observacao, setObservacao] = useState('')
  const [setorError, setSetorError] = useState(false)
  const setorRef = useRef<HTMLSelectElement>(null)

  const sortedSetores = [...setores].sort((a, b) => b.usageCount - a.usageCount)

  useEffect(() => {
    if (item) {
      setQuantidade(1)
      setSetorId('')
      setMotivo('CONSUMO_ROTINEIRO')
      setObservacao('')
      setSetorError(false)
      setTimeout(() => setorRef.current?.focus(), 50)
    }
  }, [item])

  if (!item) return null

  const handleConfirm = () => {
    if (!setorId) {
      setSetorError(true)
      setorRef.current?.focus()
      return
    }
    onConfirm({
      produtoId: item.id,
      quantidade,
      unidade: item.unidade,
      setorId,
      motivo,
      observacao: observacao || undefined,
    })
  }

  const stockOk = item.estoqueAtual > 0
  const stockColor = item.estoqueAtual === 0
    ? 'text-danger'
    : item.estoqueAtual < item.estoqueMinimo
      ? 'text-warning'
      : 'text-success'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Baixa de ${item.nome}`}
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-card rounded-t-2xl border-t border-border p-4 pb-6 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        <div className="w-8 h-1 bg-border rounded-full mx-auto mb-1" />

        {/* Product header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-surface-elevated border border-border rounded-xl flex items-center justify-center flex-shrink-0">
            <Package size={20} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-snug">{item.nome}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cód. {item.codigoInterno} · {item.categoria}</p>
            <span className={cn(
              'inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-md border',
              stockOk
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-danger/10 border-danger/30 text-danger'
            )}>
              {stockOk ? `✓ ${item.estoqueAtual} ${item.unidade} disponíveis` : 'Sem estoque'}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Stock highlight */}
        <div className="bg-surface-elevated border border-border rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Estoque atual</p>
            <p className={cn('font-mono text-3xl font-black leading-none mt-0.5', stockColor)}>
              {item.estoqueAtual}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.unidade}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Mínimo</p>
            <p className="font-mono text-lg font-bold text-muted-foreground">{item.estoqueMinimo}</p>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quantidade a baixar</p>
          <QuantityControl value={quantidade} max={item.estoqueAtual || 1} onChange={setQuantidade} />
        </div>

        {/* Setor */}
        <div>
          <label htmlFor="setor-select" className="block text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
            Setor solicitante
          </label>
          <select
            id="setor-select"
            aria-label="Setor solicitante"
            ref={setorRef}
            value={setorId}
            onChange={(e) => { setSetorId(e.target.value); setSetorError(false) }}
            className={cn(
              'w-full bg-surface-elevated border rounded-xl px-3 h-11 text-sm text-foreground outline-none appearance-none',
              setorError ? 'border-danger' : 'border-border'
            )}
          >
            <option value="">Selecione o setor...</option>
            {sortedSetores.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          {setorError && (
            <p className="text-xs text-danger mt-1" role="alert">Setor obrigatório</p>
          )}
        </div>

        {/* Motivo */}
        <div>
          <label htmlFor="motivo-select" className="block text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
            Motivo
          </label>
          <select
            id="motivo-select"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoType)}
            className="w-full bg-surface-elevated border border-border rounded-xl px-3 h-11 text-sm text-foreground outline-none appearance-none"
          >
            {MOTIVOS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Observação */}
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer select-none">Observação (opcional)</summary>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Detalhe adicional..."
            rows={2}
            className="mt-2 w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none resize-none"
          />
        </details>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 bg-surface-elevated border border-border rounded-xl text-sm font-bold text-muted-foreground"
            style={{ touchAction: 'manipulation' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!stockOk}
            className="flex-[2] h-14 bg-success rounded-xl text-sm font-black text-white disabled:opacity-40 transition-opacity"
            style={{ touchAction: 'manipulation', minHeight: 56 }}
          >
            ✓ Confirmar Baixa
          </button>
        </div>
      </div>
    </div>
  )
}
