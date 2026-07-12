// app/(dashboard)/layout.tsx
import { AppSidebar } from '@/components/dashboard/AppSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { mockAlerts } from '@/lib/mock-data/dashboard'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role === 'OPERATOR') redirect('/baixa')

  const criticalCount = mockAlerts.filter((a) => a.severidade === 'CRITICO').length

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardHeader alertCount={criticalCount} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
