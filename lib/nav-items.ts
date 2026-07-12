// lib/nav-items.ts
import {
  LayoutDashboard, Package, ArrowLeftRight, ShoppingBag,
  BarChart3, Users, Settings,
} from 'lucide-react'

export interface NavItem {
  href: string
  icon: React.ElementType
  label: string
}

export const navItems: NavItem[] = [
  { href: '/',              icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/produtos',      icon: Package,         label: 'Produtos'      },
  { href: '/movimentacoes', icon: ArrowLeftRight,  label: 'Movimentações' },
  { href: '/compras',       icon: ShoppingBag,     label: 'Compras'       },
]

export const bottomNavItems: NavItem[] = [
  { href: '/relatorios',    icon: BarChart3, label: 'Relatórios'    },
  { href: '/fornecedores',  icon: Users,     label: 'Fornecedores'  },
  { href: '/configuracoes', icon: Settings,  label: 'Configurações' },
]
