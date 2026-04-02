# Math Chinese Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Math lessons are automatically translated to Traditional Chinese at generation time; students switching to ZH mode see Chinese content, with on-demand generation if the translation is missing.

**Architecture:** Add `content_zh JSONB` to the `lessons` table. The generate-lesson route runs two sequential `generateObject` calls (EN then ZH). A new `POST /api/lessons/[id]/translate-zh` route handles lazy generation. The lesson-viewer reads `uiLang` from context and switches its content source between `content` and `content_zh` for math lessons.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Vercel AI SDK v6 (`generateObject`), Anthropic `claude-sonnet-4-6`, Zod (`MathLessonSchema`), React 19

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `lib/db/schema.ts` | Add `contentZh` nullable JSONB column |
| Modify | `app/api/generate-lesson/route.ts` | Add ZH generation after EN save |
| Create | `app/api/lessons/[id]/translate-zh/route.ts` | Lazy translation endpoint |
| Modify | `components/lesson-viewer.tsx` | ZH content switching + loading states |
| Modify | `lib/i18n.ts` | Add translation loading/error strings |

---

## Task 1: Add `content_zh` column to DB schema

**Files:**
- Modify: `lib/db/schema.ts:14-22`

- [ ] **Step 1: Add the column to the lessons table**

In `lib/db/schema.ts`, change the `lessons` table definition from:

```ts
export const lessons = pgTable('lessons', {
  id:         serial('id').primaryKey(),
  level:      text('level').notNull(),
  chapter:    integer('chapter').notNull(),
  topic:      text('topic').notNull(),
  content:    jsonb('content').notNull(),
  domain:     text('domain').default('japanese'),
  created_at: timestamp('created_at').defaultNow(),
})
```

to:

```ts
export const lessons = pgTable('lessons', {
  id:         serial('id').primaryKey(),
  level:      text('level').notNull(),
  chapter:    integer('chapter').notNull(),
  topic:      text('topic').notNull(),
  content:    jsonb('content').notNull(),
  contentZh:  jsonb('content_zh'),
  domain:     text('domain').default('japanese'),
  created_at: timestamp('created_at').defaultNow(),
})
```

The `Lesson` type (exported as `typeof lessons.$inferSelect`) automatically gains `contentZh: unknown` — no separate type change needed.

- [ ] **Step 2: Push schema to database**

```bash
cd /Users/tungsanlee/Documents/Japanese-study/japanese-platform-next
npx dotenv -e .env.local -- npx drizzle-kit push
```

Expected output: `[✓] Changes applied` (one column added to `lessons`). If prompted about data loss, answer `No` — adding a nullable column is safe.

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add content_zh column to lessons table"
```

---

## Task 2: Generate ZH translation at lesson creation time

**Files:**
- Modify: `app/api/generate-lesson/route.ts`

- [ ] **Step 1: Update imports**

Replace the current import block at the top of `app/api/generate-lesson/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { db } from '@/lib/db'
import { lessons } from '@/lib/db/schema'
import { lessonSchema, MathLessonSchema } from '@/lib/ai/schemas'
import { lessonPrompt } from '@/lib/ai/prompts'
import type { Domain } from '@/lib/domains'
import { eq } from 'drizzle-orm'
```

- [ ] **Step 2: Add ZH generation after EN save**

Replace the current `POST` handler body (everything inside the `try` block after the `generateObject` call) with:

```ts
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
```

- [ ] **Step 3: Verify the app still compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/generate-lesson/route.ts
git commit -m "feat: generate Traditional Chinese translation when creating math lesson"
```

---

## Task 3: Create lazy translate-zh API route

**Files:**
- Create: `app/api/lessons/[id]/translate-zh/route.ts`

- [ ] **Step 1: Create the route file**

Create `app/api/lessons/[id]/translate-zh/route.ts` with:

```ts
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
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add 'app/api/lessons/[id]/translate-zh/route.ts'
git commit -m "feat: add translate-zh route for on-demand math lesson translation"
```

---

## Task 4: Add i18n strings for translation loading states

**Files:**
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add strings to both locales**

In `lib/i18n.ts`, add three keys to the `en` section (after `adminNetworkError`):

```ts
    translating:      'Generating Chinese translation…',
    translateError:   'Failed to generate Chinese translation.',
    translateRetry:   'Retry',
```

And the same three keys to the `'zh-TW'` section:

```ts
    translating:      '正在生成中文翻譯…',
    translateError:   '生成中文翻譯失敗。',
    translateRetry:   '重試',
```

- [ ] **Step 2: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat: add i18n strings for math Chinese translation loading states"
```

---

## Task 5: Update lesson-viewer to render ZH content for math

**Files:**
- Modify: `components/lesson-viewer.tsx`

- [ ] **Step 1: Add `content_zh` to the lesson prop type and import `useApp`**

In `components/lesson-viewer.tsx`, change line 1 (`'use client'`) through the imports to:

```ts
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Sparkles, MessageCircle } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { useApp } from '@/app/context'
```

Change the `LessonViewerProps` interface (currently around line 23):

```ts
interface LessonViewerProps {
  lesson: {
    id: number; level: string; chapter: number; topic: string; domain: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contentZh?: any
  }
  onStartQuiz: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLessonUpdate?: (updated: any) => void
}
```

Note: Drizzle defines `contentZh: jsonb('content_zh')` — the TypeScript/JavaScript key is `contentZh` (camelCase). `NextResponse.json(rows[0])` serialises it as `"contentZh"` in the JSON response, so all client-side code uses `contentZh` (not `content_zh`).

- [ ] **Step 2: Add ZH state and effect inside `LessonViewer`**

Inside `LessonViewer`, right after `const t = useT()` (currently line 37), add:

```ts
  const { uiLang } = useApp()
  const isMath    = lessonDomain === 'math'
  const useZh     = uiLang === 'zh-TW' && isMath
  const cZh       = lesson.contentZh ?? null

  const [translating,    setTranslating]    = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [retryCount,     setRetryCount]     = useState(0)

  useEffect(() => {
    if (!useZh || cZh != null || translating) return
    setTranslating(true)
    setTranslateError(null)
    fetch(`/api/lessons/${lesson.id}/translate-zh`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        onLessonUpdate?.({ ...lesson, contentZh: data.contentZh })
      })
      .catch(err => setTranslateError(err instanceof Error ? err.message : String(err)))
      .finally(() => setTranslating(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useZh, lesson.id, cZh, retryCount])

  // Active content source: ZH when available, EN otherwise
  const c = (useZh && cZh) ? cZh : lesson.content
```

Remove the existing `const c = lesson.content` line (currently line 36).

- [ ] **Step 3: Add loading/error overlay for ZH math content**

After the opening `<div className="max-w-3xl space-y-4">` in the return statement, add a conditional block before the `<div className="flex items-start gap-3">` header:

```tsx
  return (
    <div className="max-w-3xl space-y-4">
      {/* ZH translation loading / error state — math only */}
      {useZh && cZh == null && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
          {translating && (
            <span className="inline-block h-3 w-3 rounded-full bg-primary animate-pulse shrink-0" />
          )}
          {translating
            ? t.translating
            : translateError
              ? (
                <span className="flex items-center gap-3">
                  {t.translateError}
                  <button
                    onClick={() => { setTranslateError(null); setRetryCount(n => n + 1) }}
                    className="underline hover:text-foreground"
                  >
                    {t.translateRetry}
                  </button>
                </span>
              )
            : null}
        </div>
      )}

      {/* rest of existing JSX unchanged */}
      <div className="flex items-start gap-3">
```

- [ ] **Step 4: Also use ZH title in the lesson header**

In the header section (around line 77), change:

```tsx
          <h1 className="text-2xl font-bold">{c.title}</h1>
```

This already uses `c` which now switches to `cZh` when appropriate — no extra change needed.

- [ ] **Step 5: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/lesson-viewer.tsx
git commit -m "feat: render Chinese math lesson content when uiLang is zh-TW"
```

---

## Task 6: Manual end-to-end verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test lesson generation with ZH**

1. Go to `http://localhost:3000/admin`
2. Select domain **Math**, choose any level, enter a topic (e.g. "Quadratic equations")
3. Click **Generate lesson** — wait ~40s (two generation calls)
4. After creation, check the DB directly:

```bash
npx dotenv -e .env.local -- node -e "
const { neon } = require('@neondatabase/serverless')
const sql = neon(process.env.DATABASE_URL)
sql\`SELECT id, topic, content_zh IS NOT NULL as has_zh FROM lessons ORDER BY id DESC LIMIT 3\`.then(r => console.log(JSON.stringify(r, null, 2)))
"
```

Expected: `has_zh: true` for the newly created math lesson.

- [ ] **Step 3: Test ZH rendering**

1. Open the math lesson you just created
2. Click the **Languages** icon in the sidebar to switch to 繁中 (zh-TW)
3. Verify: lesson content, concepts, worked examples, quiz questions all display in Traditional Chinese
4. Mathematical formulas and numbers should be unchanged

- [ ] **Step 4: Test lazy translation**

1. Find an older math lesson (created before this PR) — its `content_zh` will be NULL
2. Switch sidebar to 繁中
3. Navigate to the old lesson — expect the "Generating Chinese translation…" spinner to appear
4. After ~20s, the content switches to Chinese automatically

- [ ] **Step 5: Test idempotency**

Navigate away from the lesson and back while in zh-TW mode. No second translation call should fire (the effect checks `cZh != null`).

- [ ] **Step 6: Commit if any minor fixes were needed**

```bash
git add -A
git commit -m "fix: minor adjustments from e2e verification"
```

---

## Task 7: Push to remote

- [ ] **Step 1: Push**

```bash
git push
```
