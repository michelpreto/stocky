import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

export function ProductsTableSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            {['Código', 'Nome', 'Categoria', 'Embalagem', 'Estoque', 'Status', 'Custo Unit.', ''].map((h) => (
              <TableHead key={h} className="h-9 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i} className="border-border">
              <TableCell className="px-3 py-2"><Skeleton className="h-3.5 w-14 bg-surface-elevated" /></TableCell>
              <TableCell className="px-3 py-2"><Skeleton className="h-3.5 w-40 bg-surface-elevated" /></TableCell>
              <TableCell className="px-3 py-2"><Skeleton className="h-3.5 w-20 bg-surface-elevated" /></TableCell>
              <TableCell className="px-3 py-2"><Skeleton className="h-5 w-14 rounded-full bg-surface-elevated" /></TableCell>
              <TableCell className="px-3 py-2"><Skeleton className="h-3.5 w-12 bg-surface-elevated" /></TableCell>
              <TableCell className="px-3 py-2"><Skeleton className="h-5 w-16 rounded-full bg-surface-elevated" /></TableCell>
              <TableCell className="px-3 py-2"><Skeleton className="h-3.5 w-16 bg-surface-elevated" /></TableCell>
              <TableCell className="px-3 py-2"><Skeleton className="h-6 w-6 rounded bg-surface-elevated" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
