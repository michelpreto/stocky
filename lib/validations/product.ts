// lib/validations/product.ts
import { z } from 'zod'

export const productSchema = z.object({
  codigoInterno:  z.string().max(20).optional().or(z.literal('')),
  codigoBarras:   z.string().max(50).optional().or(z.literal('')),
  nome:           z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  categoryId:     z.string().min(1, 'Categoria obrigatória'),
  tipoEmbalagem:  z.enum(['FARDO','GALAO','CAIXA','PACOTE','PAR','UNIDADE','ROLO','SACO','BISNAGA','FRASCO']),
  unidadeConsumo: z.enum(['UN','KG','G','L','ML','M','CM','PAR','CX']),
  fatorEmbalagem: z.number().min(0.001, 'Fator deve ser maior que zero').max(10_000),
  controlarPor:   z.enum(['EMBALAGEM','CONSUMO']),
  custoUnitario:  z.number().min(0, 'Custo não pode ser negativo').optional(),
  estoqueAtual:   z.number().min(0).optional(),
  estoqueMinimo:  z.number().min(0).optional(),
  estoqueMaximo:  z.number().min(0).optional(),
  pontoReposicao: z.number().min(0).optional(),
  localizacao:    z.string().max(60).optional(),
  ativo:          z.boolean(),
})

export type ProductFormValues = z.infer<typeof productSchema>

export const draftSchema = z.object({
  nome:       z.string().min(1, 'Nome obrigatório'),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  ativo:      z.boolean(),
})
