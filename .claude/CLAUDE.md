# Personal Sensei — Claude Code Handover

> **Audience:** Claude Code (CLI agent)
> **Purpose:** Full project context so you can pick up development without any prior conversation.
> **Owner:** Enki (enkizan@gmail.com) — native Traditional Chinese / Mandarin speaker learning Japanese, French, and English.

---

## Project Overview

A personal multi-domain language learning web app. The primary student is a Chinese speaker, so the AI tutor and lesson generator actively leverage Chinese literacy as an advantage (kanji cognates, Sino-Japanese vocabulary, false friends, pitch-accent vs. tones, etc.).

Domains: **japanese** (JLPT N5–N1), **english** (CEFR A1–C2), **french** (CEFR A1–C2), **math**.

Features:
- AI-generated structured lessons (vocabulary, grammar, quiz, Chinese cognate notes) via Claude API
- **Dive deeper** — tool-call pipeline analyses current lesson coverage, then appends non-overlapping content
- Interactive quiz engine with per-question feedback and score persistence
- Streaming chat with domain-aware tutor personas (先生 Sensei / Professeur Lumière / Beeno / Dr. Morti)
- Progress tracking per student/lesson/score
- Admin panel to generate new lessons

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| AI | Vercel AI SDK v6, Anthropic Claude |
| Models | `claude-sonnet-4-6` for lesson generation · `claude-haiku-4-5-20251001` for chat, dive analysis, dive generation |
| Database | PostgreSQL via Neon serverless, Drizzle ORM |
| Styling | Tailwind CSS v4, shadcn/ui (Base UI), OKLCH colour system |
| Fonts | DM Sans (body), DM Mono (mono), Noto Serif JP (Japanese text) — Google Fonts |
| Auth | Cookie-based passcode gate (`proxy.ts` — Next.js 16 named export convention) |
| Deploy | Vercel |

---

## File Structure

```
├── .claude/
│   └── CLAUDE.md              ← you are here
├── app/
│   ├── (app)/                 ← authenticated route group
│   │   ├── layout.tsx         ← sidebar + main layout
│   │   ├── dashboard/
│   │   ├── lessons/
│   │   │   ├── page.tsx       ← lesson list with level tabs
│   │   │   └── [id]/
│   │   │       └── page.tsx   ← lesson viewer + dive button
│   │   ├── chat/
│   │   ├── progress/
│   │   └── admin/
│   ├── api/
│   │   ├── auth/route.ts
│   │   ├── students/
│   │   ├── lessons/
│   │   │   └── [id]/
│   │   │       └── dive/route.ts  ← two-step Haiku dive pipeline
│   │   ├── generate-lesson/route.ts
│   │   ├── progress/route.ts
│   │   ├── quiz/route.ts
│   │   ├── stats/route.ts
│   │   └── chat/route.ts
│   ├── globals.css            ← OKLCH theme, domain theming, dark mode
│   └── layout.tsx
├── components/
│   ├── sidebar.tsx            ← dark navy sidebar, domain kanji badge
│   ├── domain-picker.tsx
│   ├── lesson-viewer.tsx      ← tabbed: Content / Vocabulary / Grammar / CN Notes / Quiz
│   ├── quiz-engine.tsx
│   ├── chat-messages.tsx
│   └── ui/                   ← shadcn/ui components
├── lib/
│   ├── domains.ts             ← DOMAINS config (levels, tutor name, icon)
│   ├── ai/
│   │   ├── schemas.ts         ← Zod schemas per domain (Anthropic-safe constraints)
│   │   └── prompts.ts         ← lessonPrompt(), chatSystem() per domain
│   ├── db/
│   │   ├── index.ts           ← Drizzle client (Neon serverless)
│   │   └── schema.ts          ← students, lessons, progress tables
│   └── auth.ts
├── proxy.ts                   ← passcode middleware (Next.js 16: named export `proxy`)
├── docker-compose.yml         ← app (10002) + db (10001)
├── .env.example
└── next.config.ts
```

---

## Running the App

### Local
```bash
npm install
cp .env.example .env.local    # fill in DATABASE_URL, ANTHROPIC_API_KEY, PASSCODE
npx drizzle-kit push          # push schema to DB
npm run dev                   # → http://localhost:3000
```

### Docker
```bash
cp .env.example .env.local
docker compose up --build
# app → http://localhost:10002 · db → localhost:10001
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon or local) |
| `ANTHROPIC_API_KEY` | Yes | Used by lesson generation, dive, and chat routes |
| `PASSCODE` | Yes | Passcode to access the app |

---

## API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth` | Validate passcode, set `jp_auth` cookie (httpOnly, sameSite strict) |
| `GET` | `/api/students` | List all students |
| `POST` | `/api/students` | Create student `{name, email?, native_language?, domain?}` |
| `GET` | `/api/students/[id]` | Get student by ID |
| `PATCH` | `/api/students/[id]` | Update student (allowlisted fields only) |
| `GET` | `/api/lessons` | List lessons — optional `?level=n5&domain=japanese` |
| `GET` | `/api/lessons/[id]` | Get lesson by ID |
| `POST` | `/api/generate-lesson` | AI-generate lesson `{domain, level, chapter, topic}` |
| `POST` | `/api/lessons/[id]/dive` | Analyse lesson then append deeper content |
| `POST` | `/api/progress` | Upsert progress `{student_id, lesson_id, status, score?}` |
| `POST` | `/api/quiz` | Save quiz result, mark completed |
| `GET` | `/api/stats` | Platform-wide stats + per-student rollup |
| `POST` | `/api/chat` | Streamed AI tutor chat (AI SDK v6 `toTextStreamResponse`) |

---

## Database Schema

```sql
students (id, name, email, native_language DEFAULT 'zh', domain DEFAULT 'japanese', created_at)

lessons  (id, level, chapter INT, topic, content JSONB, domain DEFAULT 'japanese', created_at)

progress (id, student_id → students, lesson_id → lessons, status, score INT, completed_at,
          UNIQUE(student_id, lesson_id))
         -- status: 'in_progress' | 'completed'
```

---

## Lesson Content Schema (JSONB)

Each domain has a Zod schema in `lib/ai/schemas.ts`. **Anthropic structured output constraints:** no `minItems`, no `maxItems`, no `.int()`, no `.min()/.max()` on numbers — use plain `z.number()` and `z.array(z.string())`.

### Japanese / French
```ts
{
  title:          string
  content:        string          // markdown paragraphs
  vocabulary:     { word, reading, meaning_zh, meaning_en }[]
                  // French adds: pronunciation, gender
  grammar_points: { pattern, explanation, example }[]
  quiz:           { question, options: string[], answer: number, explanation }[]
  chinese_notes:  string          // cognates, false friends, pitch accent tips
}
```

### English
Same as Japanese but without `chinese_notes` and without `meaning_zh` in vocabulary.

### Math
```ts
{
  title, content,
  concepts:        { name, definition, example }[]
  worked_examples: { problem, solution, steps: string[] }[]
  quiz:            { question, options, answer, explanation }[]
  tips:            string
}
```

---

## AI Usage

| Use | Model | Notes |
|---|---|---|
| Lesson generation | `claude-sonnet-4-6` | `generateObject`, `maxOutputTokens: 4096` |
| Dive — step 1 analysis | `claude-haiku-4-5-20251001` | `generateText` + `analyze_coverage` tool, `stopWhen: stepCountIs(2)` |
| Dive — step 2 generation | `claude-haiku-4-5-20251001` | `generateObject`, appended avoidBlock in prompt |
| Chat | `claude-haiku-4-5-20251001` | `streamText` → `toTextStreamResponse()`, `maxOutputTokens: 1024` |

Haiku is used for dive (both steps) to keep total latency under ~90 seconds. Sonnet is used for initial lesson generation only (higher quality for the canonical lesson content).

---

## How Dive Works

`POST /api/lessons/[id]/dive`:

1. **Step 1 — Analyse** (Haiku + tool call): `analyze_coverage` tool receives `covered_vocabulary[]`, `covered_grammar[]`, `content_angles[]`, `deeper_angles` string
2. **Step 2 — Generate** (Haiku + generateObject): full lesson schema generated with an `avoidBlock` injected listing everything already covered
3. **Step 3 — Merge** (no AI): arrays spread-appended; content/chinese_notes/tips string-appended with `\n\n---\n\n` divider; original `title` preserved

---

## AI SDK v6 Patterns

Key breaking changes from v4/v5:

```ts
// tool() — uses inputSchema not parameters
tool({ description, inputSchema: z.object({...}), execute: async (input) => input })

// generateText — uses stopWhen not maxSteps
generateText({ ..., stopWhen: stepCountIs(2) })

// tool results — .output not .result
steps.flatMap(s => s.toolResults ?? []).find(r => r.toolName === 'x')?.output

// chat route
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
const result = streamText({ model, system, messages: convertToModelMessages(messages) })
return result.toTextStreamResponse()  // not toDataStreamResponse()

// chat client
import { TextStreamChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
const { messages, sendMessage, status } = useChat({ transport: new TextStreamChatTransport({ api }) })
// sendMessage({ text: input })  — not handleSubmit()
// m.parts (UIMessage.parts[]) — not m.content
```

---

## Styling Notes

- **CSS variables**: OKLCH format. Sidebar is always navy via `--sidebar` token (independent of `--primary` which changes per domain)
- **Domain theming**: `[data-domain="X"]` selectors in `globals.css` override `--primary` and related tokens
- **Sidebar utilities**: `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent` (shadcn v4 Tailwind tokens)
- **Fonts**: `var(--font-sans)` DM Sans · `var(--font-mono)` DM Mono · `var(--font-jp)` Noto Serif JP

---

## Proxy / Auth

`proxy.ts` (not `middleware.ts` — Next.js 16 renamed it):
```ts
export function proxy(req: NextRequest) { ... }
export const config = { matcher: ['/((?!passcode|api/auth|_next/...).*)'] }
```
Auth cookie: `jp_auth=granted`, httpOnly, sameSite strict, `secure` in production.
