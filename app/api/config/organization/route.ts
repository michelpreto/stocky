import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, nome: true, slug: true, logo: true },
  })

  if (!org) return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })

  return NextResponse.json(org)
}

const patchSchema = z.object({
  nome: z.string().min(2).max(100),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = session.user

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.issues }, { status: 400 })
  }

  const org = await db.organization.update({
    where: { id: organizationId },
    data:  { nome: parsed.data.nome },
    select: { id: true, nome: true, slug: true, logo: true },
  })

  return NextResponse.json(org)
}
