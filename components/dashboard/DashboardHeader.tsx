// components/dashboard/DashboardHeader.tsx
'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { WarehouseSelector } from './WarehouseSelector'
import { MobileNav } from './MobileNav'
import { LogoutButton } from '@/components/LogoutButton'
import { mockWarehouses } from '@/lib/mock-data/dashboard'
import type { Warehouse } from '@/types/dashboard'

interface Props {
  title?: string
  breadcrumb?: string
  alertCount?: number
  userName?: string | null
}

export function DashboardHeader({
  title = 'Dashboard',
  breadcrumb = 'Visão Geral',
  alertCount = 0,
  userName,
}: Props) {
  const [selected, setSelected] = useState<Warehouse>(mockWarehouses[0])
  const initial = userName?.trim().charAt(0).toUpperCase() || '?'

  return (
    <header className="h-11 bg-card border-b border-border flex items-center px-4 gap-2.5 flex-shrink-0">
      <MobileNav />
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="hidden lg:block w-px h-4 bg-border" />
      <span className="hidden lg:block text-xs text-muted-foreground">{breadcrumb}</span>
      <div className="flex-1" />

      <WarehouseSelector
        warehouses={mockWarehouses}
        selected={selected}
        onChange={setSelected}
      />

      <div className="relative w-8 h-8 bg-surface border border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-600 transition-colors">
        <Bell size={14} className="text-muted-foreground" />
        {alertCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full border border-card shadow-[0_0_5px_hsl(var(--color-danger)/0.6)]" />
        )}
      </div>

      <div
        title={userName ?? undefined}
        className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold"
      >
        {initial}
      </div>

      <LogoutButton />
    </header>
  )
}
