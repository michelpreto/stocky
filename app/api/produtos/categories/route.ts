import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cats = await db.category.findMany({
    where:   { organizationId: session.user.organizationId },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(cats)
}
