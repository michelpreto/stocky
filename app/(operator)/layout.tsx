// app/(operator)/layout.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/LogoutButton'

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'OPERATOR') redirect('/')

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-11 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-primary flex items-center justify-center text-white font-black text-sm">
            A
          </div>
          <span className="text-sm font-bold text-foreground">Baixa Rápida</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
            M
          </div>
          <LogoutButton />
        </div>
      </header>
      {/* Main */}
      <main className="flex-1 overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y' }}>
        {children}
      </main>
    </div>
  )
}
