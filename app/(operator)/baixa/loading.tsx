// app/(operator)/baixa/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function BaixaLoading() {
  return (
    <div className="p-3">
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-12 flex-1 rounded-xl bg-surface" />
        <Skeleton className="h-12 w-12 rounded-xl bg-surface" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  )
}
