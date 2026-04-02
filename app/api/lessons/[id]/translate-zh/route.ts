import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { db } from '@/lib/db'
import { lessons } from '@/lib/db/schema'
import { MathLessonSchema } from '@/lib/ai/schemas'
import { eq } from 'drizzle-orm'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const rows = await db.select().from(lessons).where(eq(lessons.id, numId)).limit(1)
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const lesson = rows[0]

  // Idempotent: return existing translation if already generated
  if (lesson.contentZh != null) {
    return NextResponse.json({ contentZh: lesson.contentZh })
  }

  try {
    const { object: zhObject } = await generateObject({
      model:           anthropic('claude-sonnet-4-6'),
      schema:          MathLessonSchema,
      prompt:          `Translate this English math lesson to Traditional Chinese (繁體中文).
Rules:
- Translate ALL text: title, content, concept names, definitions, examples, problem descriptions, solution text, step text, quiz questions, quiz options, quiz explanations, tips
- Keep all mathematical formulas, equations, symbols, and numbers EXACTLY as they appear — do not translate them
- Output must match the same JSON structure

Lesson to translate:
${JSON.stringify(lesson.content)}`,
      maxOutputTokens: 4096,
    })

    await db.update(lessons)
      .set({ contentZh: zhObject })
      .where(eq(lessons.id, numId))

    return NextResponse.json({ contentZh: zhObject })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
