import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: 10 | 25 | 50) => void
}

export function ProductsPagination({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = Math.min((page - 1) * pageSize + 1, total)
  const to   = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
      <span>{total === 0 ? '0 itens' : `${from}–${to} de ${total}`}</span>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value) as 10 | 25 | 50)}
          className="h-7 px-2 rounded border border-border bg-card text-[11px] focus:outline-none cursor-pointer"
        >
          <option value={10}>10 / pág</option>
          <option value={25}>25 / pág</option>
          <option value={50}>50 / pág</option>
        </select>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-7 h-7 flex items-center justify-center rounded border border-border bg-card hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          <ChevronLeft size={13} />
        </button>
        <span className="min-w-[60px] text-center">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded border border-border bg-card hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Próxima página"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
