// app/(dashboard)/produtos/loading.tsx
import { ProductsTableSkeleton } from '@/components/products/ProductsTableSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-24 bg-surface-elevated" />
          <Skeleton className="h-3.5 w-36 bg-surface-elevated" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-lg bg-surface-elevated" />
          <Skeleton className="h-8 w-32 rounded-lg bg-surface-elevated" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-56 rounded-lg bg-surface-elevated" />
        <Skeleton className="h-8 w-36 rounded-lg bg-surface-elevated" />
        <Skeleton className="h-8 w-36 rounded-lg bg-surface-elevated" />
      </div>
      <ProductsTableSkeleton />
    </div>
  )
}
