'use client'

import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Pencil, PackageOpen } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { PackagingChip } from './PackagingChip'
import { getStockStatus } from '@/types/product'
import type { Product } from '@/types/product'

interface Props {
  products: Product[]
  onEdit: (product: Product) => void
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <PackageOpen size={40} strokeWidth={1.5} />
      <p className="text-sm font-medium">Nenhum produto encontrado</p>
      <p className="text-[11px]">Ajuste os filtros ou cadastre um novo produto</p>
    </div>
  )
}

export function ProductsTable({ products, onEdit }: Props) {
  if (products.length === 0) return (
    <div className="bg-card border border-border rounded-lg">
      <EmptyState />
    </div>
  )

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Código</TableHead>
            <TableHead className="h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Nome</TableHead>
            <TableHead className="h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Categoria</TableHead>
            <TableHead className="h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Embalagem</TableHead>
            <TableHead className="h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold text-right">Estoque</TableHead>
            <TableHead className="h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Status</TableHead>
            <TableHead className="h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold text-right">Custo Unit.</TableHead>
            <TableHead className="h-9 px-3 w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const status = getStockStatus(p)
            const isDraft = !p.ativo
            const stockColor =
              status === 'critico' || status === 'zerado' ? 'text-danger' :
              status === 'baixo'   ? 'text-warning' :
              status === 'normal'  ? 'text-success' : 'text-muted-foreground'

            return (
              <TableRow
                key={p.id}
                onClick={() => onEdit(p)}
                className={cn(
                  'border-border cursor-pointer hover:bg-surface-elevated transition-colors',
                  isDraft && 'opacity-60',
                )}
              >
                <TableCell className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  {p.codigoInterno ?? '—'}
                </TableCell>
                <TableCell className={cn('px-3 py-2 text-[12px] font-medium', isDraft && 'italic text-muted-foreground')}>
                  {p.nome}
                </TableCell>
                <TableCell className="px-3 py-2 text-[11px] text-muted-foreground">
                  {p.category?.nome ?? '—'}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <PackagingChip
                    tipoEmbalagem={p.tipoEmbalagem}
                    fatorEmbalagem={p.fatorEmbalagem}
                    unidadeConsumo={p.unidadeConsumo}
                  />
                </TableCell>
                <TableCell className={cn('px-3 py-2 font-mono text-[11px] text-right', stockColor)}>
                  {p.warehouse != null
                    ? `${p.warehouse.estoqueAtual} / ${p.warehouse.estoqueMinimo}`
                    : '—'}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <StatusBadge status={status} />
                </TableCell>
                <TableCell className="px-3 py-2 font-mono text-[11px] text-right text-muted-foreground">
                  {p.custoUnitario != null
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.custoUnitario)
                    : '—'}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(p) }}
                    className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer"
                    aria-label={`Editar ${p.nome}`}
                  >
                    <Pencil size={12} />
                  </button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
