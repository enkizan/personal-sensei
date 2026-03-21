import { NextResponse } from 'next/server'

// Allow up to 5 minutes on Vercel (Pro/Enterprise)
export const maxDuration = 300
import { generateText, generateObject, tool, stepCountIs } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { lessons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { lessonSchema } from '@/lib/ai/schemas'
import { lessonPrompt } from '@/lib/ai/prompts'
import type { Domain } from '@/lib/domains'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const coverageSchema = z.object({
  covered_vocabulary: z.array(z.string())
    .describe('Exact words and phrases already taught'),
  covered_grammar:    z.array(z.string())
    .describe('Grammar patterns and structures already covered'),
  content_angles:     z.array(z.string())
    .describe('Sub-topics and angles already explored in the content'),
  deeper_angles:      z.string()
    .describe('Specific new angles, advanced aspects, or unexplored sub-topics to dive into next'),
})

type CoverageResult = z.infer<typeof coverageSchema>

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const rows = await db.select().from(lessons).where(eq(lessons.id, numId)).limit(1)
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const lesson = rows[0]

  // ── Step 1: Tool call — analyze what the current lesson already covers ──────
  // Use Haiku for the fast analysis step to keep total latency under 2 minutes
  const { steps } = await generateText({
    model:    anthropic('claude-haiku-4-5-20251001'),
    stopWhen: stepCountIs(2),
    system:   'You analyze language lessons to document what has been covered. Always call the analyze_coverage tool.',
    prompt:   `Analyze this lesson and call analyze_coverage with your findings.\n\nLesson content:\n${JSON.stringify(lesson.content, null, 2)}`,
    tools: {
      analyze_coverage: tool({
        description: 'Document exactly what this lesson covers so new content can go deeper without repeating it',
        inputSchema: coverageSchema,
        execute: async (input: CoverageResult) => input,
      }),
    },
  })

  // Extract the tool result from the steps
  const analysis = steps
    .flatMap(s => s.toolResults ?? [])
    .find(r => r.toolName === 'analyze_coverage')
    ?.output as CoverageResult | undefined

  // ── Step 2: Generate new content that doesn't repeat what was covered ───────
  const avoidBlock = analysis
    ? `\n\n${'─'.repeat(60)}
ALREADY COVERED IN THIS LESSON — DO NOT REPEAT ANY OF THESE:

Vocabulary already taught: ${analysis.covered_vocabulary.join(', ')}
Grammar already covered:   ${analysis.covered_grammar.join(', ')}
Angles already explored:   ${analysis.content_angles.join(' | ')}

NEW ANGLES TO DIVE INTO:
${analysis.deeper_angles}
${'─'.repeat(60)}\n
Generate ENTIRELY FRESH content — different vocabulary, different grammar examples, deeper or adjacent sub-topics.`
    : '\n\nGenerate deeper content that goes beyond the basics of this topic.'

  const { object: newContent } = await generateObject({
    model:           anthropic('claude-haiku-4-5-20251001'),
    schema:          lessonSchema(lesson.domain as Domain),
    maxOutputTokens: 4096,
    prompt:          lessonPrompt(lesson.domain as Domain, lesson.level, lesson.chapter, lesson.topic) + avoidBlock,
  })

  // ── Step 3: Append new content onto the existing lesson ─────────────────────
  const existing = lesson.content as Record<string, unknown>
  const fresh    = newContent   as Record<string, unknown>

  const merged: Record<string, unknown> = {
    // Keep the original title — the lesson identity doesn't change
    title:          existing.title,
    // Append content paragraphs with a visual divider
    content:        (existing.content as string) + '\n\n---\n\n' + (fresh.content as string),
    // Extend all array sections with new items
    vocabulary:     [...(existing.vocabulary     as unknown[]), ...(fresh.vocabulary     as unknown[])],
    grammar_points: [...(existing.grammar_points as unknown[]), ...(fresh.grammar_points as unknown[])],
    quiz:           [...(existing.quiz           as unknown[]), ...(fresh.quiz           as unknown[])],
    // Math-specific array fields
    ...(existing.concepts        ? { concepts:        [...(existing.concepts        as unknown[]), ...(fresh.concepts        as unknown[])] } : {}),
    ...(existing.worked_examples ? { worked_examples: [...(existing.worked_examples as unknown[]), ...(fresh.worked_examples as unknown[])] } : {}),
    // Append string-only fields
    ...(existing.chinese_notes !== undefined ? { chinese_notes: (existing.chinese_notes as string) + '\n\n' + (fresh.chinese_notes as string) } : {}),
    ...(existing.tips          !== undefined ? { tips:          (existing.tips          as string) + '\n\n' + (fresh.tips          as string) }  : {}),
  }

  const [updated] = await db
    .update(lessons)
    .set({ content: merged })
    .where(eq(lessons.id, numId))
    .returning()

  return NextResponse.json(updated)
}
