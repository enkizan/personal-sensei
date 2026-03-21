# Personal Sensei — AI Language Learning Platform

A personal multi-domain language learning platform powered by Claude. Built for a native Chinese (Traditional Chinese / Mandarin) speaker — lessons and the AI tutor actively leverage Chinese literacy as a learning advantage.

## Features

- **Multi-domain lessons** — Japanese (JLPT N5–N1), English (CEFR A1–C2), French (CEFR A1–C2), Math
- **AI-generated structured lessons** — vocabulary, grammar points, quiz, Chinese cognate notes
- **Dive deeper** — one click analyses what a lesson already covers, then appends fresh vocabulary, grammar, content, and quiz questions that go deeper without repeating anything
- **Quiz engine** — per-question feedback, score tracking, progress persistence
- **Ask Sensei / Professeur Lumière / Beeno / Dr. Morti** — domain-aware AI tutor chat, streamed responses
- **Progress tracking** — per-student lesson scores and completion status
- **Admin panel** — generate new lessons by level, chapter, and topic
- **Passcode gate** — simple cookie-based auth for personal/family use
- **Dark mode** — full dark/light theme toggle
- **Domain theming** — distinct colour palette per domain (rust for Japanese, blue for English, indigo for French, green for Math)

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| AI | Vercel AI SDK v6, Anthropic Claude (`claude-sonnet-4-6` for lessons, `claude-haiku-4-5-20251001` for chat and dive analysis) |
| Database | PostgreSQL (Neon serverless), Drizzle ORM |
| Styling | Tailwind CSS v4, shadcn/ui, OKLCH colour system |
| Fonts | DM Sans, DM Mono, Noto Serif JP (Google Fonts) |
| Auth | Cookie-based passcode gate (`proxy.ts`) |
| Deploy | Vercel (recommended) |

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL (local or [Neon](https://neon.tech) free tier)
- Anthropic API key

### Setup

```bash
git clone https://github.com/enkizan/personal-sensei.git
cd personal-sensei

npm install

cp .env.example .env.local
# Fill in: DATABASE_URL, ANTHROPIC_API_KEY, PASSCODE
```

### Database

```bash
# Push schema to your database
npx drizzle-kit push
```

### Run

```bash
npm run dev
# → http://localhost:3000
```

### Docker (full stack)

```bash
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY and PASSCODE
docker compose up --build
# app  → http://localhost:10002
# db   → localhost:10001
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `PASSCODE` | Yes | Passcode to access the app |

## API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth` | Validate passcode, set auth cookie |
| `GET` | `/api/students` | List all students |
| `POST` | `/api/students` | Create student |
| `GET` | `/api/lessons` | List lessons (optional `?level=n5&domain=japanese`) |
| `GET` | `/api/lessons/[id]` | Get lesson by ID |
| `POST` | `/api/generate-lesson` | AI-generate a new lesson |
| `POST` | `/api/lessons/[id]/dive` | Analyse lesson then append deeper content |
| `POST` | `/api/progress` | Upsert student progress |
| `POST` | `/api/quiz` | Save quiz result |
| `GET` | `/api/stats` | Platform-wide stats |
| `POST` | `/api/chat` | Streamed AI tutor chat |

## How Dive Works

The `/api/lessons/[id]/dive` endpoint runs a two-step AI pipeline:

1. **Analyse** (Haiku) — a tool call documents every vocabulary word, grammar pattern, and content angle already in the lesson
2. **Generate** (Haiku) — generates a full new lesson block with an explicit "do not repeat" list injected into the prompt
3. **Merge** — new vocabulary/grammar/quiz items are appended to the existing arrays; content paragraphs are appended with a `---` divider; Chinese notes are appended

Each dive call permanently deepens the lesson in the database.

## Lesson Content Schema

Each domain has a typed Zod schema. Japanese example:

```ts
{
  title:          string
  content:        string          // markdown, multiple paragraphs
  vocabulary:     { word, reading, meaning_zh, meaning_en }[]
  grammar_points: { pattern, explanation, example }[]
  quiz:           { question, options, answer, explanation }[]  // answer is 0-based index
  chinese_notes:  string          // cognates, false friends, pitch accent tips
}
```

French adds `gender` to vocabulary items. Math uses `concepts`, `worked_examples`, and `tips` instead.
