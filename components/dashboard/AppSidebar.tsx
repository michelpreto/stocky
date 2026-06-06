// components/dashboard/AppSidebar.tsx
import Link from 'next/link'
import {
  LayoutDashboard, Package, ArrowLeftRight, ShoppingBag,
  BarChart3, Users, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',              icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/produtos',      icon: Package,         label: 'Produtos'      },
  { href: '/movimentacoes', icon: ArrowLeftRight,  label: 'Movimentações' },
  { href: '/compras',       icon: ShoppingBag,     label: 'Compras'       },
]

const bottomItems = [
  { href: '/relatorios',    icon: BarChart3, label: 'Relatórios'    },
  { href: '/fornecedores',  icon: Users,     label: 'Fornecedores'  },
  { href: '/configuracoes', icon: Settings,  label: 'Configurações' },
]

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

interface Props {
  activeHref?: string
}

export function AppSidebar({ activeHref = '/' }: Props) {
  return (
    <aside className="w-[52px] bg-card border-r border-border flex flex-col items-center py-3 gap-1 flex-shrink-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-primary flex items-center justify-center text-white font-bold text-sm mb-4 flex-shrink-0">
        A
      </div>

      {navItems.map((item) => (
        <NavIcon key={item.href} {...item} active={activeHref === item.href} />
      ))}

      <div className="w-6 h-px bg-border my-1.5" />

      {bottomItems.map((item) => (
        <NavIcon key={item.href} {...item} active={activeHref === item.href} />
      ))}

      <div className="flex-1" />

      <div
        title="Almoxarifado"
        className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center cursor-pointer hover:border-slate-600 transition-colors"
      >
        <span className="text-[8px] font-bold text-muted-foreground text-center leading-tight">ALM</span>
      </div>

      <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold mt-1 cursor-pointer">
        M
      </div>
    </aside>
  )
}
