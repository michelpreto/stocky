import { gerarDescricaoEmbalagem } from '@/types/product'
import type { TipoEmbalagem, UnidadeConsumo } from '@/types/product'

interface Props {
  tipoEmbalagem: TipoEmbalagem
  fatorEmbalagem: number
  unidadeConsumo: UnidadeConsumo
}

export function PackagingChip({ tipoEmbalagem, fatorEmbalagem, unidadeConsumo }: Props) {
  const codigo = gerarDescricaoEmbalagem(tipoEmbalagem, fatorEmbalagem, unidadeConsumo)
  return (
    <span className="font-mono text-[10px] bg-surface-elevated text-muted-foreground px-1.5 py-0.5 rounded border border-border">
      {codigo}
    </span>
  )
}
