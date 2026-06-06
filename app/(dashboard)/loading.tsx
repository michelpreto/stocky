// app/(dashboard)/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="h-full p-3.5 flex flex-col gap-3">
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(4, 1fr) 88px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg bg-surface" />
        ))}
      </div>
      <div className="grid gap-2.5 flex-1" style={{ gridTemplateColumns: '1fr 1fr 260px' }}>
        <Skeleton className="rounded-lg bg-surface" />
        <Skeleton className="rounded-lg bg-surface" />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="flex-1 rounded-lg bg-surface" />
          <Skeleton className="h-40 rounded-lg bg-surface" />
        </div>
      </div>
    </div>
  )
}
