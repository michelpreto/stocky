// app/(operator)/baixa/page.tsx
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { SearchField }         from '@/components/operator/SearchField'
import { CameraButton }        from '@/components/operator/CameraButton'
import { SearchResultList }    from '@/components/operator/SearchResultList'
import { BaixaModal }          from '@/components/operator/BaixaModal'
import { ConfirmationScreen }  from '@/components/operator/ConfirmationScreen'
import { RecentList }          from '@/components/operator/RecentList'
import { OfflineBanner }       from '@/components/operator/OfflineBanner'
import { mockSetores, mockRecentBaixas } from '@/lib/mock-data/operator'
import { enqueue, dequeue, getAll } from '@/lib/offline-queue'
import type { SearchResult, BaixaInput, RecentBaixa } from '@/types/operator'

async function searchProducts(query: string): Promise<SearchResult[]> {
  if (query.length < 2) return []
  const res = await fetch(`/api/produtos/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.map((p: any) => ({
    id:           p.id,
    nome:         p.nome,
    codigoInterno: p.codigoInterno ?? '',
    codigoBarras: p.codigoBarras ?? undefined,
    categoria:    p.category?.nome ?? '',
    unidade:      (p.unidadeConsumo as string).toLowerCase(),
    estoqueAtual: p.productWarehouses?.[0]?.estoqueAtual ?? 0,
    estoqueMinimo: p.productWarehouses?.[0]?.estoqueMinimo ?? 0,
    foto:         p.foto ?? undefined,
    // Extra: carry warehouseId for the movimentacao call
    _warehouseId: p.productWarehouses?.[0]?.warehouseId ?? '',
  }))
}

async function registrarBaixa(productId: string, warehouseId: string, quantidade: number, observacao?: string) {
  const res = await fetch('/api/movimentacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, warehouseId, tipo: 'SAIDA', quantidade, observacao }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).error ?? 'Erro ao registrar baixa')
  }
  return res.json()
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return isOnline
}

export default function BaixaPage() {
  const isOnline = useOnlineStatus()
  const [query, setQuery]       = useState('')
  const [searchKey, setSearchKey] = useState(0)
  const [results, setResults]   = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [confirmation, setConfirmation] = useState<{
    baixa: BaixaInput
    produto: SearchResult
  } | null>(null)
  const [recentBaixas, setRecentBaixas] = useState<RecentBaixa[]>(mockRecentBaixas)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pendingCount = getAll().length

  // Debounced API search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (query.length < 2) {
      setResults([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      const found = await searchProducts(query)
      setResults(found)
    }, 250)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [query])

  const handleConfirm = useCallback(async (baixa: BaixaInput) => {
    if (!selected) return
    const warehouseId = (selected as any)._warehouseId as string
    let synced = false
    let queueId: string
    if (isOnline && warehouseId) {
      try {
        await registrarBaixa(baixa.produtoId, warehouseId, baixa.quantidade, baixa.observacao)
        synced = true
        queueId = `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      } catch {
        // Fall back to offline queue
        queueId = enqueue(baixa)
      }
    } else {
      queueId = enqueue(baixa)
    }
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const newRecent: RecentBaixa = {
      id: queueId,
      produtoNome: selected.nome,
      quantidade: baixa.quantidade,
      unidade: baixa.unidade,
      hora,
      expiresAt: Date.now() + 60_000,
      synced,
    }
    setRecentBaixas((prev) => [newRecent, ...prev].slice(0, 10))
    setConfirmation({ baixa, produto: selected })
    setSelected(null)
  }, [selected, isOnline])

  const handleConfirmationComplete = useCallback(() => {
    setConfirmation(null)
    setQuery('')
    setSearchKey((k) => k + 1)
  }, [])

  const handleUndo = useCallback((id: string) => {
    dequeue(id)
    setRecentBaixas((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const setor = confirmation
    ? mockSetores.find((s) => s.id === confirmation.baixa.setorId)?.nome ?? ''
    : ''

  return (
    <>
      <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} />

      <div className="flex gap-2 px-3 pt-3 pb-2">
        <SearchField
          key={searchKey}
          value={query}
          onChange={setQuery}
          isOffline={!isOnline}
          autoFocus
        />
        <CameraButton onCapture={(filename) => setQuery(filename.split('.')[0])} />
      </div>

      {!query && (
        <p className="text-xs text-muted-foreground text-center px-3 pb-2">
          Toque em um item para dar baixa
        </p>
      )}

      <SearchResultList
        results={results}
        onSelect={setSelected}
        query={query}
        isOffline={!isOnline}
      />

      <RecentList items={recentBaixas} onUndo={handleUndo} />

      <BaixaModal
        item={selected}
        setores={mockSetores}
        onClose={() => setSelected(null)}
        onConfirm={handleConfirm}
      />

      {confirmation && (
        <ConfirmationScreen
          baixa={confirmation.baixa}
          produto={confirmation.produto}
          setorNome={setor}
          onComplete={handleConfirmationComplete}
        />
      )}
    </>
  )
}
