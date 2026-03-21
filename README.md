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
- **Domain theming** — distinct colour palette per domain

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
npx drizzle-kit push
```

### Run

```bash
npm run dev
# → http://localhost:3000
```

### Docker (full stack)

```bash
cp .env.example .env.local
docker compose up --build
# app → http://localhost:10002
# db  → localhost:10001
```
