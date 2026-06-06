// app/(operator)/baixa/page.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { SearchField }         from '@/components/operator/SearchField'
import { CameraButton }        from '@/components/operator/CameraButton'
import { SearchResultList }    from '@/components/operator/SearchResultList'
import { BaixaModal }          from '@/components/operator/BaixaModal'
import { ConfirmationScreen }  from '@/components/operator/ConfirmationScreen'
import { RecentList }          from '@/components/operator/RecentList'
import { OfflineBanner }       from '@/components/operator/OfflineBanner'
import { mockSearchResults, mockSetores, mockRecentBaixas } from '@/lib/mock-data/operator'
import { enqueue, dequeue, getAll } from '@/lib/offline-queue'
import type { SearchResult, BaixaInput, RecentBaixa } from '@/types/operator'

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

function filterResults(query: string, all: SearchResult[]): SearchResult[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return all.filter(
    (r) =>
      r.nome.toLowerCase().includes(q) ||
      r.codigoInterno.includes(q) ||
      (r.codigoBarras ?? '').includes(q)
  ).slice(0, 5)
}

export default function BaixaPage() {
  const isOnline = useOnlineStatus()
  const [query, setQuery]       = useState('')
  const [searchKey, setSearchKey] = useState(0)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [confirmation, setConfirmation] = useState<{
    baixa: BaixaInput
    produto: SearchResult
  } | null>(null)
  const [recentBaixas, setRecentBaixas] = useState<RecentBaixa[]>(mockRecentBaixas)

  const results = filterResults(query, mockSearchResults)
  const pendingCount = getAll().length

  const handleConfirm = useCallback((baixa: BaixaInput) => {
    if (!selected) return
    const id = enqueue(baixa)
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const newRecent: RecentBaixa = {
      id,
      produtoNome: selected.nome,
      quantidade: baixa.quantidade,
      unidade: baixa.unidade,
      hora,
      expiresAt: Date.now() + 60_000,
      synced: isOnline,
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
