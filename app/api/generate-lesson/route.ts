import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { db } from '@/lib/db'
import { lessons } from '@/lib/db/schema'
import { lessonSchema, MathLessonSchema } from '@/lib/ai/schemas'
import { lessonPrompt } from '@/lib/ai/prompts'
import type { Domain } from '@/lib/domains'
import { eq } from 'drizzle-orm'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { domain = 'japanese', level = 'n5', chapter = 1, topic: rawTopic = '' } = await req.json()
  const topic = rawTopic.trim() || 'random'

  try {
    const { object } = await generateObject({
      model:           anthropic('claude-sonnet-4-6'),
      schema:          lessonSchema(domain as Domain),
      prompt:          lessonPrompt(domain as Domain, level, chapter, topic),
      maxOutputTokens: 4096,
    })

    // When topic was random, store the AI-chosen title so the DB record is meaningful
    const storedTopic = topic === 'random' ? (object as any).title : topic

    const rows = await db.insert(lessons).values({
      level, chapter, topic: storedTopic, domain,
      content: object,
    }).returning()

    // For math, immediately generate a Traditional Chinese translation
    if (domain === 'math') {
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
${JSON.stringify(object)}`,
          maxOutputTokens: 4096,
        })
        await db.update(lessons)
          .set({ contentZh: zhObject })
          .where(eq(lessons.id, rows[0].id))
      } catch {
        // ZH generation failure is non-fatal — lesson is still usable in English
      }
    }

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
