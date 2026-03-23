import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { students } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

function parseId(id: string) {
  const n = parseInt(id)
  return isNaN(n) ? null : n
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseId(id)
  if (!numId) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  const rows = await db.select().from(students).where(eq(students.id, numId)).limit(1)
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseId(id)
  if (!numId) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  // Allowlist only mutable fields — never pass raw body to .set()
  const body = await req.json()
  const { name, email, native_language, domain, home_domain } = body
  const patch: Record<string, unknown> = {}
  if (name            !== undefined) patch.name            = name
  if (email           !== undefined) patch.email           = email
  if (native_language !== undefined) patch.native_language = native_language
  if (domain          !== undefined) patch.domain          = domain
  if (home_domain     !== undefined) patch.home_domain     = home_domain
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'no valid fields to update' }, { status: 400 })
  }

  const rows = await db.update(students).set(patch).where(eq(students.id, numId)).returning()
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}
