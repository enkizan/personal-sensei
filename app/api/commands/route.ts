import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { db } from '@/lib/db'
import { chatCommands } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function generateCommandPrompt(commandName: string, description: string): Promise<string> {
  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: `You are generating a system instruction for an AI language tutor.
The user has described a chat command shortcut.
Write a concise, effective system prompt (2–5 sentences) that instructs the AI how to behave when this command is invoked.
Be specific and actionable. Output the prompt text only, no explanation.`,
    prompt: `Command: /${commandName}\nDescription: ${description}`,
    maxOutputTokens: 256,
  })
  return text.trim()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get('student_id') ?? '')
  if (isNaN(studentId)) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

  const rows = await db.select().from(chatCommands)
    .where(eq(chatCommands.student_id, studentId))
    .orderBy(chatCommands.created_at)
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const { student_id, command_name, description } = await req.json()
  if (!student_id || !command_name || !description) {
    return NextResponse.json({ error: 'student_id, command_name, description required' }, { status: 400 })
  }

  // Normalise: strip leading slash if user included one
  const name = (command_name as string).replace(/^\/+/, '').trim().toLowerCase()
  if (!name) return NextResponse.json({ error: 'command_name is empty' }, { status: 400 })

  const prompt = await generateCommandPrompt(name, description)

  const rows = await db.insert(chatCommands)
    .values({ student_id, command_name: name, description, prompt })
    .returning()
  return NextResponse.json(rows[0], { status: 201 })
}
