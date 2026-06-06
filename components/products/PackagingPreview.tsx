import { gerarDescricaoEmbalagem } from '@/types/product'
import type { TipoEmbalagem, UnidadeConsumo } from '@/types/product'

const LABELS: Record<TipoEmbalagem, string> = {
  FARDO:   'FARDO',   GALAO:   'GALÃO',   CAIXA:   'CAIXA',
  PACOTE:  'PACOTE',  PAR:     'PAR',     UNIDADE: 'UNIDADE',
  ROLO:    'ROLO',    SACO:    'SACO',    BISNAGA: 'BISNAGA',
  FRASCO:  'FRASCO',
}

const LABELS_PLURAL: Record<TipoEmbalagem, string> = {
  FARDO:   'fardos',   GALAO:   'galões',   CAIXA:   'caixas',
  PACOTE:  'pacotes',  PAR:     'pares',    UNIDADE: 'unidades',
  ROLO:    'rolos',    SACO:    'sacos',    BISNAGA: 'bisnagas',
  FRASCO:  'frascos',
}

interface Props {
  tipoEmbalagem: TipoEmbalagem
  fatorEmbalagem: number
  unidadeConsumo: UnidadeConsumo
}

export function PackagingPreview({ tipoEmbalagem, fatorEmbalagem, unidadeConsumo }: Props) {
  const codigo  = gerarDescricaoEmbalagem(tipoEmbalagem, fatorEmbalagem, unidadeConsumo)
  const label   = LABELS[tipoEmbalagem]
  const plural  = LABELS_PLURAL[tipoEmbalagem]
  const entrada = 12 * fatorEmbalagem
  const baixa   = 2 * fatorEmbalagem

  return (
    <div className="bg-surface-elevated border border-border rounded-lg p-3 text-[11px] space-y-2 font-mono">
      <p className="text-foreground font-semibold">
        1 {label} = {fatorEmbalagem} {unidadeConsumo}
      </p>
      <div className="border-t border-border pt-2 space-y-1 text-muted-foreground">
        <p>Entrada de 12 {plural} → +{entrada} {unidadeConsumo} ao estoque</p>
        <p>Baixa de 2 {plural} → −{baixa} {unidadeConsumo} do estoque</p>
      </div>
      <div className="border-t border-border pt-2">
        <span className="text-muted-foreground">Código: </span>
        <span className="text-foreground">{codigo}</span>
      </div>
    </div>
  )
}
