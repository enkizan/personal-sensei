import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { db } from '@/lib/db'
import { lessons } from '@/lib/db/schema'
import { lessonSchema } from '@/lib/ai/schemas'
import { lessonPrompt } from '@/lib/ai/prompts'
import type { Domain } from '@/lib/domains'

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

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
