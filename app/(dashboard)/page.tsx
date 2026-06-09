// app/(dashboard)/page.tsx
import { cookies } from 'next/headers'
import { KpiCard }                 from '@/components/dashboard/KpiCard'
import { DonutMini }               from '@/components/dashboard/DonutMini'
import { MonthlyConsumptionChart } from '@/components/dashboard/MonthlyConsumptionChart'
import { AlertList }               from '@/components/dashboard/AlertList'
import { CriticalItemsList }       from '@/components/dashboard/CriticalItemsList'
import { MovementsTable }          from '@/components/dashboard/MovementsTable'
import { DollarSign, Package, AlertTriangle, ArrowLeftRight } from 'lucide-react'
import { formatCurrency, formatNumber, formatDelta } from '@/lib/format'
import { mockCategories } from '@/lib/mock-data/dashboard'

async function fetchDashboard(path: string, cookieHeader: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/dashboard/${path}`, {
    cache:   'no-store',
    headers: { cookie: cookieHeader },
  })
  if (!res.ok) return null
  return res.json()
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const [kpi, movements, alerts, criticalItems, monthlyData] = await Promise.all([
    fetchDashboard('kpis',                cookieHeader),
    fetchDashboard('movements',           cookieHeader),
    fetchDashboard('alerts',              cookieHeader),
    fetchDashboard('critical-items',      cookieHeader),
    fetchDashboard('monthly-consumption', cookieHeader),
  ])

  const { valorEstoque, itensCadastrados, itensAbaixoMinimo, saidasHoje, deltas } = kpi ?? {
    valorEstoque: 0, itensCadastrados: 0, itensAbaixoMinimo: 0, saidasHoje: 0,
    deltas: {
      valorEstoque:      { value: 0, direction: 'neutral' },
      itensCadastrados:  { value: 0, direction: 'neutral' },
      itensAbaixoMinimo: { value: 0, direction: 'neutral' },
      saidasHoje:        { value: 0, direction: 'neutral' },
    },
  }

  return (
    <div className="h-full p-3.5 flex flex-col gap-3 overflow-hidden">

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-[repeat(4,1fr)_88px] gap-2.5 flex-shrink-0">
        <KpiCard
          label="Valor em estoque"
          value={formatCurrency(valorEstoque)}
          delta={formatDelta(deltas.valorEstoque.value, deltas.valorEstoque.direction, deltas.valorEstoque.suffix)}
          icon={<DollarSign size={13} />}
        />
        <KpiCard
          label="Itens cadastrados"
          value={formatNumber(itensCadastrados)}
          delta={formatDelta(deltas.itensCadastrados.value, deltas.itensCadastrados.direction, deltas.itensCadastrados.suffix)}
          icon={<Package size={13} />}
          valueColor="text-primary"
        />
        <KpiCard
          label="Abaixo do mínimo"
          value={String(itensAbaixoMinimo)}
          delta={formatDelta(deltas.itensAbaixoMinimo.value, deltas.itensAbaixoMinimo.direction, deltas.itensAbaixoMinimo.suffix)}
          icon={<AlertTriangle size={13} />}
          valueColor="text-danger"
        />
        <KpiCard
          label="Saídas hoje"
          value={String(saidasHoje)}
          delta={formatDelta(deltas.saidasHoje.value, deltas.saidasHoje.direction)}
          icon={<ArrowLeftRight size={13} />}
          valueColor="text-warning"
        />
        <div className="col-span-2 lg:col-span-1">
          <DonutMini categories={mockCategories} />
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_260px] gap-2.5 flex-1 min-h-0 overflow-auto xl:overflow-hidden">
        <MonthlyConsumptionChart data={monthlyData ?? []} />
        <MovementsTable movements={movements ?? []} />
        <div className="flex flex-col gap-2.5 overflow-hidden">
          <AlertList alerts={alerts ?? []} />
          <CriticalItemsList items={criticalItems ?? []} />
        </div>
      </div>

    </div>
  )
}
