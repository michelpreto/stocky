import type {
  Product, ProductWarehouse, StockMovement,
  User, Category, Warehouse,
} from '@/lib/generated/prisma'

export type ProductWithWarehouse = Product & {
  warehouse: ProductWarehouse | null
  category: Category
}

export type MovementWithRelations = StockMovement & {
  product:   Pick<Product,   'id' | 'nome' | 'unidadeConsumo'>
  user:      Pick<User,      'id' | 'nome'>
  warehouse: Pick<Warehouse, 'id' | 'nome'>
}
