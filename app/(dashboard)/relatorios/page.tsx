// app/(dashboard)/relatorios/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Package, ArrowLeftRight } from 'lucide-react'
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

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-surface-elevated rounded', className)} />
}

export default function RelatoriosPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [monthly, setMonthly] = useState<MonthlyItem[]>([])
  const [critical, setCritical] = useState<CriticalItem[]>([])
  const [recentMovs, setRecentMovs] = useState<MovItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/kpis').then(r => r.json()).catch(() => null),
      fetch('/api/dashboard/monthly-consumption').then(r => r.json()).catch(() => []),
      fetch('/api/dashboard/critical-items').then(r => r.json()).catch(() => []),
      fetch('/api/movimentacoes?limit=10').then(r => r.json()).then(d => d.items ?? []).catch(() => []),
    ]).then(([k, m, c, mv]) => {
      setKpis(k)
      setMonthly(m)
      setCritical(c)
      setRecentMovs(mv)
    }).finally(() => setLoading(false))
  }, [])

  const tipoBadge = (t: string) => {
    if (t === 'ENTRADA') return 'bg-success/15 text-success'
    if (t === 'SAIDA') return 'bg-danger/15 text-danger'
    return 'bg-warning/15 text-warning'
  }

  const kpiCards = [
    { label: 'Valor Total Estoque', value: kpis ? `R$ ${kpis.valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null },
    { label: 'Itens Cadastrados', value: kpis ? String(kpis.itensCadastrados) : null },
    { label: 'Itens Abaixo Mínimo', value: kpis ? String(kpis.itensAbaixoMinimo) : null },
    { label: 'Saídas Hoje', value: kpis ? String(kpis.saidasHoje) : null },
  ]

  return (
    <div className="p-5 flex flex-col gap-6 h-full overflow-auto">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Relatórios e Análises</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">{card.label}</span>
            {loading || card.value === null
              ? <Skeleton className="h-6 w-24 mt-1" />
              : <span className="text-sm font-semibold text-foreground">{card.value}</span>
            }
          </div>
        ))}
      </div>

      {/* Consumo Mensal */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Consumo Mensal</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Mês</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Unidades Consumidas</th>
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
              ) : monthly.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-8 text-center text-[12px] text-muted-foreground">Sem dados de consumo</td>
                </tr>
              ) : monthly.slice(-6).map(row => (
                <tr key={row.month} className="border-t border-border hover:bg-surface-elevated transition-colors">
                  <td className="px-3 py-2 text-[12px] text-foreground">{row.month}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground">{row.unidades.toLocaleString('pt-BR')}</td>
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
          {!loading && <span className="text-[11px] text-muted-foreground bg-danger/15 text-danger px-2 py-0.5 rounded-full">{critical.length}</span>}
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Produto</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Estoque Atual</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Mínimo</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Déficit</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Unidade</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : critical.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="w-6 h-6 opacity-30" />
                      <span className="text-[12px]">Nenhum item abaixo do mínimo</span>
                    </div>
                  </td>
                </tr>
              ) : critical.map(item => (
                <tr key={item.id} className="border-t border-border hover:bg-surface-elevated transition-colors">
                  <td className="px-3 py-2 text-[12px] text-foreground">{item.nome}</td>
                  <td className="px-3 py-2 text-[12px] text-danger font-medium">{item.estoqueAtual}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground">{item.estoqueMinimo}</td>
                  <td className="px-3 py-2 text-[12px] text-danger">{(item.estoqueMinimo - item.estoqueAtual).toFixed(2)}</td>
                  <td className="px-3 py-2 text-[12px] text-muted-foreground">{item.unidade}</td>
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
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Data/Hora</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Tipo</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Produto</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Qtd</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Almoxarifado</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Usuário</th>
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
                  <td className="px-3 py-2 text-[12px] text-foreground">{item.product.nome}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground">{item.quantidade} {item.product.unidadeConsumo}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground">{item.warehouse.nome}</td>
                  <td className="px-3 py-2 text-[12px] text-foreground">{item.user.nome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
