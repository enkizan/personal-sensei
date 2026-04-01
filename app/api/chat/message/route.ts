import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chatMessages } from '@/lib/db/schema'

export async function POST(req: Request) {
  const { conversation_id, role, content } = await req.json()

  if (!conversation_id || !role || !content) {
    return NextResponse.json(
      { error: 'conversation_id, role, and content required' },
      { status: 400 }
    )
  }

  if (role !== 'user' && role !== 'assistant') {
    return NextResponse.json({ error: 'role must be user or assistant' }, { status: 400 })
  }

  const [message] = await db
    .insert(chatMessages)
    .values({ conversation_id, role, content })
    .returning()

  return NextResponse.json({ message })
}
