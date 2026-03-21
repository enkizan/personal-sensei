import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { chatSystem } from '@/lib/ai/prompts'
import type { Domain } from '@/lib/domains'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const {
    messages,
    domain        = 'japanese',
    studentName   = 'Student',
    lessonContext = '',
  } = await req.json()

  const result = streamText({
    model:     anthropic('claude-haiku-4-5-20251001'),
    system:    chatSystem(domain as Domain, studentName, lessonContext),
    messages,
    maxTokens: 1024,
  })

  return result.toDataStreamResponse()
}
