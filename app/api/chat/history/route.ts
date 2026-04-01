import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chatConversations, chatMessages } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id')
  const domain    = searchParams.get('domain')
  const lessonId  = parseInt(searchParams.get('lesson_id') ?? '-1')

  if (!studentId || !domain) {
    return NextResponse.json({ error: 'student_id and domain required' }, { status: 400 })
  }

  const numStudentId = parseInt(studentId)
  if (isNaN(numStudentId)) {
    return NextResponse.json({ error: 'invalid student_id' }, { status: 400 })
  }

  const conversation = await db
    .select()
    .from(chatConversations)
    .where(
      and(
        eq(chatConversations.student_id, numStudentId),
        eq(chatConversations.domain, domain),
        eq(chatConversations.lesson_id, lessonId),
        eq(chatConversations.is_active, true),
      )
    )
    .limit(1)
    .then(rows => rows[0] ?? null)

  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [] })
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversation_id, conversation.id))
    .orderBy(asc(chatMessages.created_at))

  return NextResponse.json({ conversation, messages })
}

export async function POST(req: Request) {
  const { student_id, domain, lesson_id = -1 } = await req.json()

  if (!student_id || !domain) {
    return NextResponse.json({ error: 'student_id and domain required' }, { status: 400 })
  }

  // Archive any existing active conversation for this scope
  await db
    .update(chatConversations)
    .set({ is_active: false })
    .where(
      and(
        eq(chatConversations.student_id, student_id),
        eq(chatConversations.domain, domain),
        eq(chatConversations.lesson_id, lesson_id),
        eq(chatConversations.is_active, true),
      )
    )

  // Create the new active conversation
  const [conversation] = await db
    .insert(chatConversations)
    .values({ student_id, domain, lesson_id, is_active: true })
    .returning()

  return NextResponse.json({ conversation })
}
