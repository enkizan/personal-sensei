import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { lessons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Allow up to 2 minutes on Vercel
export const maxDuration = 120

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const grammarIndex = typeof body.grammar_index === 'number' ? body.grammar_index : null
  if (grammarIndex === null) return NextResponse.json({ error: 'grammar_index required' }, { status: 400 })

  const rows = await db.select().from(lessons).where(eq(lessons.id, numId)).limit(1)
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const lesson = rows[0]

  const content = lesson.content as Record<string, unknown>
  const grammarPoints = (content.grammar_points ?? []) as Array<Record<string, unknown>>
  const gp = grammarPoints[grammarIndex]
  if (!gp) return NextResponse.json({ error: 'grammar point not found' }, { status: 400 })

  // Collect vocabulary words to use in examples
  const vocab = (content.vocabulary ?? []) as Array<Record<string, unknown>>
  const vocabList = vocab.map(v => v.word as string).filter(Boolean).join(', ')

  // Build a compact description of what already exists so we don't repeat
  const existingExamples = [
    gp.example as string,
    ...((gp.examples ?? []) as string[]),
  ].filter(Boolean)

  const domainHints: Record<string, string> = {
    japanese: 'Write each sentence in Japanese with furigana in parentheses for kanji, followed by an English translation in parentheses. E.g. 食べました（たべました）— I ate.',
    english:  'Write each sentence in English. Keep the level appropriate for the lesson.',
    french:   'Write each sentence in French followed by an English translation in parentheses.',
    math:     'Write each sentence or worked example demonstrating the pattern clearly.',
  }
  const hint = domainHints[lesson.domain ?? 'japanese'] ?? domainHints['japanese']

  const { object } = await generateObject({
    model:           anthropic('claude-haiku-4-5-20251001'),
    maxOutputTokens: 1024,
    schema: z.object({
      examples: z.array(z.string()).describe('3 new example sentences'),
    }),
    prompt: `You are generating example sentences for a language lesson.

Grammar pattern: ${gp.pattern as string}
Explanation: ${gp.explanation as string}
Lesson vocabulary (prefer using these words): ${vocabList || 'none listed'}

${hint}

Generate exactly 3 new example sentences that:
1. Clearly demonstrate the grammar pattern "${gp.pattern as string}"
2. Use vocabulary from the lesson where possible
3. Are different from the existing examples below

Existing examples (do NOT repeat these):
${existingExamples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`,
  })

  // Append new examples to the grammar point
  const updatedGrammarPoints = grammarPoints.map((g, i) => {
    if (i !== grammarIndex) return g
    const current = (g.examples ?? []) as string[]
    return { ...g, examples: [...current, ...object.examples] }
  })

  const [updated] = await db
    .update(lessons)
    .set({ content: { ...content, grammar_points: updatedGrammarPoints } })
    .where(eq(lessons.id, numId))
    .returning()

  return NextResponse.json(updated)
}
