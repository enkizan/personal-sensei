import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { lessons } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const domain = searchParams.get('domain') ?? 'japanese'
  const level  = searchParams.get('level')

  const conditions = [eq(lessons.domain, domain)]
  if (level) conditions.push(eq(lessons.level, level))

  const rows = await db.select().from(lessons).where(and(...conditions))
    .orderBy(lessons.chapter)
  return NextResponse.json(rows)
}
