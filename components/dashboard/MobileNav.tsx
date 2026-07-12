// components/dashboard/MobileNav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { navItems, bottomNavItems, type NavItem } from '@/lib/nav-items'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function NavRow({ href, icon: Icon, label }: NavItem) {
    const active = pathname === href
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={cn(
          'h-10 px-3 rounded-lg flex items-center gap-3 text-[13px] font-medium transition-colors',
          active
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
        )}
      >
        <Icon size={18} />
        {label}
      </Link>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer flex-shrink-0"
      >
        <Menu size={18} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[260px] p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-sm font-semibold">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => <NavRow key={item.href} {...item} />)}
            <div className="h-px bg-border my-2" />
            {bottomNavItems.map((item) => <NavRow key={item.href} {...item} />)}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
