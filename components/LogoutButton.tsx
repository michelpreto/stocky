// components/LogoutButton.tsx
'use client'

import { LogOut } from 'lucide-react'
import { logoutAction } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

export function LogoutButton({ className }: Props) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        title="Sair"
        className={cn(
          'h-7 px-2.5 rounded-lg border border-border text-[11px] text-foreground hover:border-slate-600 hover:bg-surface-elevated transition-colors cursor-pointer flex items-center gap-1.5',
          className
        )}
      >
        <LogOut className="w-3 h-3" />
        Sair
      </button>
    </form>
  )
}
