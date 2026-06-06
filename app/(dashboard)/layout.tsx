// app/(dashboard)/layout.tsx
import { AppSidebar } from '@/components/dashboard/AppSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { mockAlerts } from '@/lib/mock-data/dashboard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const criticalCount = mockAlerts.filter((a) => a.severidade === 'CRITICO').length

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar activeHref="/" />
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardHeader alertCount={criticalCount} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
