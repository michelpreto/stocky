// app/(dashboard)/relatorios/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BarChart3, Package, ArrowLeftRight, AlertCircle, RefreshCw, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPIs { valorEstoque: number; itensCadastrados: number; itensAbaixoMinimo: number; saidasHoje: number }
interface MonthlyItem { month: string; unidades: number }
interface CriticalItem { id: string; nome: string; estoqueAtual: number; estoqueMinimo: number; unidade: string }
interface MovItem {
  id: string; tipo: string; quantidade: number; createdAt: string
  product: { nome: string; unidadeConsumo: string }
  user: { nome: string }
  warehouse: { nome: string }
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-surface-elevated rounded', className)} />
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
      <AlertCircle className="w-6 h-6 text-danger opacity-80" />
      <span className="text-[12px] text-foreground">Erro ao carregar os dados.</span>
      <button
        onClick={onRetry}
        className="h-7 px-3 rounded-lg border border-border text-[11px] text-foreground hover:border-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <RefreshCw className="w-3 h-3" />
        Tentar novamente
      </button>
    </div>
  )
}

function ErrorRow({ colSpan, onRetry }: { colSpan: number; onRetry: () => void }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-2">
        <ErrorState onRetry={onRetry} />
      </td>
    </tr>
  )
}

export default function RelatoriosPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [monthly, setMonthly] = useState<MonthlyItem[]>([])
  const [critical, setCritical] = useState<CriticalItem[]>([])
  const [recentMovs, setRecentMovs] = useState<MovItem[]>([])
  const [loading, setLoading] = useState(true)

  const [kpisError, setKpisError] = useState(false)
  const [monthlyError, setMonthlyError] = useState(false)
  const [criticalError, setCriticalError] = useState(false)
  const [movsError, setMovsError] = useState(false)

  const loadKpis = useCallback(async () => {
    setKpisError(false)
    try {
      const res = await fetch('/api/dashboard/kpis')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setKpis(await res.json())
    } catch {
      setKpisError(true)
    }
  }, [])

  const loadMonthly = useCallback(async () => {
    setMonthlyError(false)
    try {
      const res = await fetch('/api/dashboard/monthly-consumption')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMonthly(await res.json())
    } catch {
      setMonthlyError(true)
    }
  }, [])

  const loadCritical = useCallback(async () => {
    setCriticalError(false)
    try {
      const res = await fetch('/api/dashboard/critical-items')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setCritical(await res.json())
    } catch {
      setCriticalError(true)
    }
  }, [])

  const loadMovs = useCallback(async () => {
    setMovsError(false)
    try {
      const res = await fetch('/api/movimentacoes?limit=10')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRecentMovs(data.items ?? [])
    } catch {
      setMovsError(true)
    }
  }, [])

  useEffect(() => {
    Promise.all([loadKpis(), loadMonthly(), loadCritical(), loadMovs()]).finally(() => setLoading(false))
  }, [loadKpis, loadMonthly, loadCritical, loadMovs])

  const tipoBadge = (t: string) => {
    if (t === 'ENTRADA') return 'bg-success/15 text-success'
    if (t === 'SAIDA') return 'bg-danger/15 text-danger'
    return 'bg-warning/15 text-warning'
  }

  const kpiCards = [
    { label: 'Valor Total Estoque', value: kpis ? currencyFormatter.format(kpis.valorEstoque) : null, danger: false },
    { label: 'Itens Cadastrados', value: kpis ? String(kpis.itensCadastrados) : null, danger: false },
    { label: 'Itens Abaixo Mínimo', value: kpis ? String(kpis.itensAbaixoMinimo) : null, danger: !!kpis && kpis.itensAbaixoMinimo > 0 },
    { label: 'Saídas Hoje', value: kpis ? String(kpis.saidasHoje) : null, danger: false },
  ]

  return (
    <div className="p-5 flex flex-col gap-6 h-full overflow-auto">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Relatórios e Análises</h1>
      </div>

      {/* KPI Cards */}
      {kpisError ? (
        <div className="bg-card border border-border rounded-lg">
          <ErrorState onRetry={loadKpis} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpiCards.map(card => (
            <div key={card.label} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{card.label}</span>
              {loading || card.value === null
                ? <Skeleton className="h-7 w-24 mt-1" />
                : <span className={cn('text-2xl font-semibold font-mono tabular-nums', card.danger ? 'text-danger' : 'text-foreground')}>{card.value}</span>
              }
            </div>
          ))}
        </div>
      )}

      {/* Consumo Mensal */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Consumo Mensal</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <caption className="sr-only">Unidades consumidas nos últimos 6 meses</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Mês</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Unidades Consumidas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : monthlyError ? (
                <ErrorRow colSpan={2} onRetry={loadMonthly} />
              ) : monthly.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-8 text-center text-[12px] text-muted-foreground">Sem dados de consumo</td>
                </tr>
              ) : monthly.slice(-6).map(row => (
                <tr key={row.month} className="border-t border-border hover:bg-surface-elevated transition-colors">
                  <td className="px-3 py-2 text-[12px] text-foreground">{row.month}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground font-mono tabular-nums">{row.unidades.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Itens Críticos */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Itens Críticos</h2>
          {!loading && <span className="text-[11px] font-mono tabular-nums bg-danger/15 text-danger px-2 py-0.5 rounded-full">{critical.length}</span>}
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <caption className="sr-only">Itens com estoque abaixo do mínimo configurado</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Produto</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Estoque Atual</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Mínimo</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Déficit</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Unidade</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : criticalError ? (
                <ErrorRow colSpan={6} onRetry={loadCritical} />
              ) : critical.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="w-6 h-6 opacity-30" />
                      <span className="text-[12px]">Nenhum item abaixo do mínimo</span>
                    </div>
                  </td>
                </tr>
              ) : critical.map(item => (
                <tr key={item.id} className="border-t border-border hover:bg-surface-elevated transition-colors">
                  <td className="px-3 py-2 text-[12px] text-foreground max-w-[240px] truncate" title={item.nome}>{item.nome}</td>
                  <td className="px-3 py-2 text-[12px] text-danger font-medium font-mono tabular-nums">{item.estoqueAtual}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground font-mono tabular-nums">{item.estoqueMinimo}</td>
                  <td className="px-3 py-2 text-[12px] text-danger font-medium font-mono tabular-nums">{(item.estoqueMinimo - item.estoqueAtual).toFixed(2)}</td>
                  <td className="px-3 py-2 text-[12px] text-muted-foreground">{item.unidade}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/compras?productId=${item.id}`}
                      aria-label={`Comprar ${item.nome}`}
                      className="h-7 px-2.5 rounded-lg border border-border text-[11px] text-foreground hover:border-slate-600 hover:bg-surface-elevated transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Comprar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movimentações Recentes */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Movimentações Recentes</h2>
          <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <caption className="sr-only">Últimas 10 movimentações de estoque registradas</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Data/Hora</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Tipo</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Produto</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Qtd</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Almoxarifado</th>
                <th scope="col" className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Usuário</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : movsError ? (
                <ErrorRow colSpan={6} onRetry={loadMovs} />
              ) : recentMovs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-muted-foreground">Nenhuma movimentação</td>
                </tr>
              ) : recentMovs.map(item => (
                <tr key={item.id} className="border-t border-border hover:bg-surface-elevated transition-colors">
                  <td className="px-3 py-2 text-[12px] text-foreground whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', tipoBadge(item.tipo))}>
                      {item.tipo}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-foreground max-w-[200px] truncate" title={item.product.nome}>{item.product.nome}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground font-mono tabular-nums">{item.quantidade} {item.product.unidadeConsumo}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground">{item.warehouse.nome}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground">{item.user.nome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {loading ? 'Carregando relatórios' : 'Relatórios carregados'}
      </p>
    </div>
  )
}
