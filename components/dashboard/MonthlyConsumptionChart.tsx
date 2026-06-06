'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { MonthlyData } from '@/types/dashboard'

interface Props {
  data: MonthlyData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-mono font-semibold text-foreground">
        {new Intl.NumberFormat('pt-BR').format(payload[0].value)} un
      </p>
    </div>
  )
}

export function MonthlyConsumptionChart({ data }: Props) {
  const lastIndex = data.length - 1

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-foreground">Consumo Mensal</p>
          <p className="text-[11px] text-muted-foreground">Últimos 6 meses · unidades</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
          Recharts
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--color-border))"
              vertical={false}
            />
            <XAxis
              dataKey="mes"
              stroke="hsl(var(--color-border))"
              tick={{ fill: 'hsl(var(--color-muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--color-border))"
              tick={{ fill: 'hsl(var(--color-muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--color-border)/0.3)' }} />
            <Bar dataKey="unidades" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === lastIndex ? '#22C55E' : '#3B82F6'}
                  opacity={i === lastIndex ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
