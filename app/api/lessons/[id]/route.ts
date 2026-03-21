import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { lessons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  const rows = await db.select().from(lessons).where(eq(lessons.id, numId)).limit(1)
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })
  // content is JSONB — Drizzle returns it already parsed, no JSON.parse needed
  return NextResponse.json(rows[0])
}
