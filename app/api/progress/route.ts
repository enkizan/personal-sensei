import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { progress } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id')
  if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })
  const numId = parseInt(studentId)
  if (isNaN(numId)) return NextResponse.json({ error: 'invalid student_id' }, { status: 400 })
  const rows = await db.select().from(progress)
    .where(eq(progress.student_id, numId))
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const { student_id, lesson_id, status = 'in_progress', score } = await req.json()
  if (!student_id || !lesson_id) {
    return NextResponse.json({ error: 'student_id and lesson_id required' }, { status: 400 })
  }
  const completedAt = status === 'completed' ? new Date() : null

  const rows = await db.insert(progress)
    .values({ student_id, lesson_id, status, score, completed_at: completedAt })
    .onConflictDoUpdate({
      target: [progress.student_id, progress.lesson_id],
      set:    { status, score, completed_at: completedAt },
    })
    .returning()
  return NextResponse.json(rows[0])
}
