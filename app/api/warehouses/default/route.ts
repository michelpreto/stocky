// app/api/warehouses/default/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const wh = await db.warehouse.findFirst({
    where:   { organizationId: session.user.organizationId, ativo: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!wh) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(wh)
}
