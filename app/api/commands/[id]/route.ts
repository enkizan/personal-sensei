import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { db } from '@/lib/db'
import { chatCommands } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function parseId(id: string) {
  const n = parseInt(id)
  return isNaN(n) ? null : n
}

async function regenerateCommandPrompt(
  commandName: string,
  description: string,
  currentPrompt: string,
): Promise<string> {
  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: `You are generating a system instruction for an AI language tutor.
The user has described a chat command shortcut.
Write a concise, effective system prompt (2–5 sentences) that instructs the AI how to behave when this command is invoked.
Be specific and actionable. Output the prompt text only, no explanation.`,
    prompt: `Command: /${commandName}
Description: ${description}
Current prompt (user may have edited): ${currentPrompt}
Refine or rewrite the prompt based on the updated description.`,
    maxOutputTokens: 256,
  })
  return text.trim()
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseId(id)
  if (!numId) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  const rows = await db.select().from(chatCommands).where(eq(chatCommands.id, numId)).limit(1)
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseId(id)
  if (!numId) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const { description, prompt: currentPrompt } = await req.json()
  if (!description) return NextResponse.json({ error: 'description required' }, { status: 400 })

  const existing = await db.select().from(chatCommands).where(eq(chatCommands.id, numId)).limit(1)
  if (!existing[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const newPrompt = await regenerateCommandPrompt(
    existing[0].command_name,
    description,
    currentPrompt ?? existing[0].prompt,
  )

  const rows = await db.update(chatCommands)
    .set({ description, prompt: newPrompt })
    .where(eq(chatCommands.id, numId))
    .returning()
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseId(id)
  if (!numId) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  await db.delete(chatCommands).where(eq(chatCommands.id, numId))
  return NextResponse.json({ ok: true })
}
