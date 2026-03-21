import { z } from 'zod'
import type { Domain } from '@/lib/domains'

const QuizItem = z.object({
  question:    z.string(),
  options:     z.array(z.string()).length(4),
  answer:      z.number().int().min(0).max(3),
  explanation: z.string(),
})

export const JapaneseLessonSchema = z.object({
  title:          z.string(),
  content:        z.string(),
  vocabulary:     z.array(z.object({
    word: z.string(), reading: z.string(), meaning_zh: z.string(), meaning_en: z.string(),
  })),
  grammar_points: z.array(z.object({
    pattern: z.string(), explanation: z.string(), example: z.string(),
  })),
  quiz:           z.array(QuizItem),
  chinese_notes:  z.string(),
})

export const EnglishLessonSchema = z.object({
  title:          z.string(),
  content:        z.string(),
  vocabulary:     z.array(z.object({
    word: z.string(), reading: z.string(), meaning_en: z.string(),
  })),
  grammar_points: z.array(z.object({
    pattern: z.string(), explanation: z.string(), example: z.string(),
  })),
  quiz:           z.array(QuizItem),
})

export const FrenchLessonSchema = z.object({
  title:          z.string(),
  content:        z.string(),
  vocabulary:     z.array(z.object({
    word: z.string(), pronunciation: z.string(), meaning_en: z.string(), gender: z.string(),
  })),
  grammar_points: z.array(z.object({
    pattern: z.string(), explanation: z.string(), example: z.string(),
  })),
  quiz:           z.array(QuizItem),
  chinese_notes:  z.string(),  // cognates, loanwords, pronunciation tips for Chinese speakers
})

export const MathLessonSchema = z.object({
  title:           z.string(),
  content:         z.string(),
  concepts:        z.array(z.object({
    name: z.string(), definition: z.string(), example: z.string(),
  })),
  worked_examples: z.array(z.object({
    problem: z.string(), solution: z.string(), steps: z.array(z.string()),
  })),
  quiz:            z.array(QuizItem),
  tips:            z.string(),
})

export type LessonContent =
  | (z.infer<typeof JapaneseLessonSchema> & { _domain: 'japanese' })
  | (z.infer<typeof EnglishLessonSchema>  & { _domain: 'english' })
  | (z.infer<typeof FrenchLessonSchema>   & { _domain: 'french' })
  | (z.infer<typeof MathLessonSchema>     & { _domain: 'math' })

export function lessonSchema(domain: Domain) {
  if (domain === 'english') return EnglishLessonSchema
  if (domain === 'french')  return FrenchLessonSchema
  if (domain === 'math')    return MathLessonSchema
  return JapaneseLessonSchema
}
