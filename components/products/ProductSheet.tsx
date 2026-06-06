'use client'

import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { PackagingPreview } from './PackagingPreview'
import { productSchema, draftSchema, type ProductFormValues } from '@/lib/validations/product'
import type { Product, Category, TipoEmbalagem, UnidadeConsumo } from '@/types/product'

const TIPOS_EMBALAGEM: TipoEmbalagem[] = [
  'UNIDADE', 'GALAO', 'FARDO', 'CAIXA', 'PACOTE', 'PAR', 'ROLO', 'SACO', 'BISNAGA', 'FRASCO',
]

const UNIDADES_CONSUMO: UnidadeConsumo[] = [
  'UN', 'L', 'ML', 'KG', 'G', 'M', 'CM', 'PAR', 'CX',
]

interface Props {
  open: boolean
  product: Product | null
  categories: Category[]
  onClose: () => void
  onSave: (data: ProductFormValues) => Promise<void>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[10px] text-danger mt-0.5">{message}</p>
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
      {children}{required && <span className="text-danger ml-0.5">*</span>}
    </label>
  )
}

export function ProductSheet({ open, product, categories, onClose, onSave }: Props) {
  const isNew = product === null

  const {
    register, handleSubmit, control, reset, getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nome: '', categoryId: '', codigoInterno: '', codigoBarras: '',
      tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'UN', fatorEmbalagem: 1,
      controlarPor: 'EMBALAGEM', ativo: true,
      estoqueAtual: 0, estoqueMinimo: 0,
    },
  })

  const tipoWatched    = useWatch({ control, name: 'tipoEmbalagem' })
  const fatorWatched   = useWatch({ control, name: 'fatorEmbalagem' })
  const unidadeWatched = useWatch({ control, name: 'unidadeConsumo' })

  useEffect(() => {
    if (!open) return
    if (product) {
      reset({
        nome: product.nome,
        categoryId: product.categoryId,
        codigoInterno: product.codigoInterno ?? '',
        codigoBarras: product.codigoBarras ?? '',
        tipoEmbalagem: product.tipoEmbalagem,
        unidadeConsumo: product.unidadeConsumo,
        fatorEmbalagem: product.fatorEmbalagem,
        controlarPor: product.controlarPor,
        custoUnitario: product.custoUnitario,
        estoqueAtual: product.warehouse?.estoqueAtual ?? 0,
        estoqueMinimo: product.warehouse?.estoqueMinimo ?? 0,
        estoqueMaximo: product.warehouse?.estoqueMaximo,
        pontoReposicao: product.warehouse?.pontoReposicao,
        localizacao: product.warehouse?.localizacao ?? '',
        ativo: product.ativo,
      })
    } else {
      reset({
        nome: '', categoryId: '', codigoInterno: '', codigoBarras: '',
        tipoEmbalagem: 'UNIDADE', unidadeConsumo: 'UN', fatorEmbalagem: 1,
        controlarPor: 'EMBALAGEM', ativo: true,
        estoqueAtual: 0, estoqueMinimo: 0,
      })
    }
  }, [open, product, reset])

  async function handleSaveDraft() {
    const current = getValues()
    const parsed = draftSchema.safeParse({
      nome: current.nome, categoryId: current.categoryId, ativo: false,
    })
    if (!parsed.success) return
    await onSave({ ...current, ativo: false })
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0" showCloseButton>
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <SheetTitle className="text-base">
            {isNew ? 'Novo Produto' : `Editar: ${product?.nome}`}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSave)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <Tabs defaultValue="geral" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="mx-5 mt-3 flex-shrink-0">
              <TabsTrigger value="geral" className={cn(errors.nome || errors.categoryId ? 'relative after:absolute after:top-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-danger after:rounded-full' : '')}>
                Dados Gerais
              </TabsTrigger>
              <TabsTrigger value="estoque">Estoque</TabsTrigger>
              <TabsTrigger value="embalagem" className={cn(errors.tipoEmbalagem || errors.fatorEmbalagem ? 'relative after:absolute after:top-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-danger after:rounded-full' : '')}>
                Embalagem
              </TabsTrigger>
              <TabsTrigger value="midia">Mídia</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* ABA: DADOS GERAIS */}
              <TabsContent value="geral" className="p-5 space-y-4 mt-0">
                <div>
                  <FieldLabel required>Nome</FieldLabel>
                  <Input {...register('nome')} placeholder="Ex: Álcool 70% 1L Talge" className="bg-card" />
                  <FieldError message={errors.nome?.message} />
                </div>
                <div>
                  <FieldLabel required>Categoria</FieldLabel>
                  <select
                    {...register('categoryId')}
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-ring cursor-pointer transition-colors"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  <FieldError message={errors.categoryId?.message} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Código Interno</FieldLabel>
                    <Input {...register('codigoInterno')} placeholder="Ex: 00034" className="bg-card font-mono" />
                  </div>
                  <div>
                    <FieldLabel>Código de Barras</FieldLabel>
                    <Input {...register('codigoBarras')} placeholder="EAN-13" className="bg-card font-mono" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    {...register('ativo')}
                    className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
                  />
                  <label htmlFor="ativo" className="text-[12px] text-foreground cursor-pointer">
                    Produto ativo (desmarque para salvar como rascunho)
                  </label>
                </div>
              </TabsContent>

              {/* ABA: ESTOQUE */}
              <TabsContent value="estoque" className="p-5 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Estoque Atual</FieldLabel>
                    <Input
                      {...register('estoqueAtual', { valueAsNumber: true })}
                      type="number" min="0" step="0.001"
                      className="bg-card font-mono"
                    />
                    <FieldError message={errors.estoqueAtual?.message} />
                  </div>
                  <div>
                    <FieldLabel>Estoque Mínimo</FieldLabel>
                    <Input
                      {...register('estoqueMinimo', { valueAsNumber: true })}
                      type="number" min="0" step="0.001"
                      className="bg-card font-mono"
                    />
                    <FieldError message={errors.estoqueMinimo?.message} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Estoque Máximo</FieldLabel>
                    <Input
                      {...register('estoqueMaximo', { valueAsNumber: true })}
                      type="number" min="0" step="0.001"
                      className="bg-card font-mono"
                    />
                  </div>
                  <div>
                    <FieldLabel>Ponto de Reposição</FieldLabel>
                    <Input
                      {...register('pontoReposicao', { valueAsNumber: true })}
                      type="number" min="0" step="0.001"
                      className="bg-card font-mono"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Custo Unitário (R$)</FieldLabel>
                  <Input
                    {...register('custoUnitario', { valueAsNumber: true })}
                    type="number" min="0" step="0.01"
                    placeholder="0,00"
                    className="bg-card font-mono"
                  />
                  <FieldError message={errors.custoUnitario?.message} />
                </div>
                <div>
                  <FieldLabel>Localização</FieldLabel>
                  <Input
                    {...register('localizacao')}
                    placeholder="Ex: Corredor A / Prateleira 2"
                    className="bg-card"
                  />
                </div>
              </TabsContent>

              {/* ABA: EMBALAGEM */}
              <TabsContent value="embalagem" className="p-5 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel required>Tipo de Embalagem</FieldLabel>
                    <select
                      {...register('tipoEmbalagem')}
                      className="w-full h-8 px-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-ring cursor-pointer"
                    >
                      {TIPOS_EMBALAGEM.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <FieldError message={errors.tipoEmbalagem?.message} />
                  </div>
                  <div>
                    <FieldLabel required>Unidade de Consumo</FieldLabel>
                    <select
                      {...register('unidadeConsumo')}
                      className="w-full h-8 px-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-ring cursor-pointer"
                    >
                      {UNIDADES_CONSUMO.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <FieldError message={errors.unidadeConsumo?.message} />
                  </div>
                </div>
                <div>
                  <FieldLabel required>Fator de Conversão</FieldLabel>
                  <Input
                    {...register('fatorEmbalagem', { valueAsNumber: true })}
                    type="number" min="0.001" step="0.001"
                    className="bg-card font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Quantas unidades de consumo cabem em 1 embalagem (ex: 1 galão = 5 litros → fator 5)
                  </p>
                  <FieldError message={errors.fatorEmbalagem?.message} />
                </div>
                <div>
                  <FieldLabel>Controlar por</FieldLabel>
                  <div className="flex gap-3">
                    {(['EMBALAGEM', 'CONSUMO'] as const).map((v) => (
                      <label key={v} className="flex items-center gap-1.5 text-[12px] text-foreground cursor-pointer">
                        <input
                          type="radio"
                          value={v}
                          {...register('controlarPor')}
                          className="accent-primary cursor-pointer"
                        />
                        {v === 'EMBALAGEM' ? 'Embalagem (padrão)' : 'Unidade de consumo'}
                      </label>
                    ))}
                  </div>
                </div>
                {tipoWatched && fatorWatched > 0 && unidadeWatched && (
                  <PackagingPreview
                    tipoEmbalagem={tipoWatched}
                    fatorEmbalagem={fatorWatched}
                    unidadeConsumo={unidadeWatched}
                  />
                )}
              </TabsContent>

              {/* ABA: MÍDIA */}
              <TabsContent value="midia" className="p-5 mt-0">
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <p className="text-sm">Upload de imagem — disponível em breve</p>
                  <p className="text-[11px]">Foto do produto e ficha de segurança</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <SheetFooter className="px-5 py-4 border-t border-border flex-shrink-0 flex-row justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded-lg border border-border text-[12px] text-muted-foreground hover:border-slate-600 hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="h-8 px-4 rounded-lg border border-border bg-surface-elevated text-[12px] text-foreground hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              Salvar Rascunho
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 size={12} className="animate-spin" />}
              Salvar Produto
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
