import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { students, lessons, progress } from '@/lib/db/schema'
import { count, avg } from 'drizzle-orm'

export async function GET() {
  const [studentCount]  = await db.select({ count: count() }).from(students)
  const [lessonCount]   = await db.select({ count: count() }).from(lessons)
  const [progressCount] = await db.select({ count: count() }).from(progress)
  const [avgScore]      = await db.select({ avg: avg(progress.score) }).from(progress)
  return NextResponse.json({
    total_students: studentCount.count,
    total_lessons:  lessonCount.count,
    total_progress: progressCount.count,
    avg_score: avgScore.avg ? Math.round(Number(avgScore.avg)) : null,
  })
}
