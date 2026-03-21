import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { students } from '@/lib/db/schema'

export async function GET() {
  const rows = await db.select().from(students).orderBy(students.created_at)
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const { name, email, native_language } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const rows = await db.insert(students).values({ name, email, native_language }).returning()
  return NextResponse.json(rows[0], { status: 201 })
}
