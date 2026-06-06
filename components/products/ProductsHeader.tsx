import { Plus, Download } from 'lucide-react'

interface Props {
  total: number
  onNew: () => void
  onExport: () => void
}

export function ProductsHeader({ total, onNew, onExport }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Produtos</h1>
        <p className="text-[11px] text-muted-foreground">
          {total} {total === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-[12px] text-muted-foreground hover:border-slate-600 hover:text-foreground transition-colors cursor-pointer"
        >
          <Download size={13} />
          Exportar Excel
        </button>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus size={13} />
          Novo Produto
        </button>
      </div>
    </div>
  )
}
