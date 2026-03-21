import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { progress } from '@/lib/db/schema'

export async function POST(req: Request) {
  const { student_id, lesson_id, score } = await req.json()
  if (!student_id || !lesson_id) {
    return NextResponse.json({ error: 'student_id and lesson_id required' }, { status: 400 })
  }
  const rows = await db.insert(progress)
    .values({ student_id, lesson_id, status: 'completed', score, completed_at: new Date() })
    .onConflictDoUpdate({
      target: [progress.student_id, progress.lesson_id],
      set:    { status: 'completed', score, completed_at: new Date() },
    })
    .returning()
  return NextResponse.json(rows[0])
}
