// components/dashboard/AppSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, bottomNavItems } from '@/lib/nav-items'
import { cn } from '@/lib/utils'

interface NavIconProps {
  href: string
  icon: React.ElementType
  label: string
  active?: boolean
}

function NavIcon({ href, icon: Icon, label, active }: NavIconProps) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
      )}
    >
      <Icon size={18} />
    </Link>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[52px] bg-card border-r border-border flex flex-col items-center py-3 gap-1 flex-shrink-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-primary flex items-center justify-center text-white font-bold text-sm mb-4 flex-shrink-0">
        A
      </div>

      {navItems.map((item) => (
        <NavIcon key={item.href} {...item} active={pathname === item.href} />
      ))}

      <div className="w-6 h-px bg-border my-1.5" />

      {bottomNavItems.map((item) => (
        <NavIcon key={item.href} {...item} active={pathname === item.href} />
      ))}
    </aside>
  )
}
