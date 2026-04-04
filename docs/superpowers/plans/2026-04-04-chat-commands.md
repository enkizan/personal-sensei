# Chat Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-student `/command` shortcuts to Ask Sensei chat — users create commands with a description, AI generates a system prompt, and typing `/command text` in chat silently injects that prompt for that turn.

**Architecture:** New `chat_commands` table scoped to students. Three new pages (manage, create, edit) under `/commands`. Chat page gains autocomplete dropdown and parses `/command` on submit, passing `commandPrompt` to the existing chat API route which injects it into the system prompt string.

**Tech Stack:** Drizzle ORM (Neon/PostgreSQL), Next.js 16 App Router, Vercel AI SDK v6 `generateText`, Anthropic Haiku, Tailwind CSS v4, shadcn/ui, `lib/i18n.ts` for strings.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `lib/db/schema.ts` | Modify | Add `chatCommands` table |
| `app/api/commands/route.ts` | Create | GET list + POST create+generate |
| `app/api/commands/[id]/route.ts` | Create | PATCH update+regenerate, DELETE |
| `lib/i18n.ts` | Modify | Add command i18n strings |
| `components/sidebar.tsx` | Modify | Add /commands nav entry |
| `app/(app)/commands/page.tsx` | Create | Manage list page |
| `app/(app)/commands/new/page.tsx` | Create | Create command form |
| `app/(app)/commands/[id]/page.tsx` | Create | Edit command form |
| `app/(app)/chat/page.tsx` | Modify | Autocomplete + command parsing on submit |
| `app/api/chat/route.ts` | Modify | Accept + inject `commandPrompt` |

---

## Task 1: Add `chatCommands` table to DB schema

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add table definition**

Open `lib/db/schema.ts` and add after the `chatMessages` table (before the `export type` lines):

```ts
export const chatCommands = pgTable('chat_commands', {
  id:           serial('id').primaryKey(),
  student_id:   integer('student_id').notNull().references(() => students.id),
  command_name: text('command_name').notNull(),  // without slash, e.g. "polish"
  description:  text('description').notNull(),
  prompt:       text('prompt').notNull(),
  created_at:   timestamp('created_at').defaultNow(),
}, t => ({
  uniq: unique().on(t.student_id, t.command_name),
}))
```

Also add the export type at the bottom:

```ts
export type ChatCommand = typeof chatCommands.$inferSelect
```

- [ ] **Step 2: Push schema to database**

```bash
npx drizzle-kit push
```

Expected: `chatCommands` table created with unique constraint on `(student_id, command_name)`. No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add chat_commands table to schema"
```

---

## Task 2: API route — GET list + POST create with AI generation

**Files:**
- Create: `app/api/commands/route.ts`

- [ ] **Step 1: Create the route file**

```ts
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { db } from '@/lib/db'
import { chatCommands } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function generateCommandPrompt(commandName: string, description: string): Promise<string> {
  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: `You are generating a system instruction for an AI language tutor.
The user has described a chat command shortcut.
Write a concise, effective system prompt (2–5 sentences) that instructs the AI how to behave when this command is invoked.
Be specific and actionable. Output the prompt text only, no explanation.`,
    prompt: `Command: /${commandName}\nDescription: ${description}`,
    maxOutputTokens: 256,
  })
  return text.trim()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get('student_id') ?? '')
  if (isNaN(studentId)) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

  const rows = await db.select().from(chatCommands)
    .where(eq(chatCommands.student_id, studentId))
    .orderBy(chatCommands.created_at)
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const { student_id, command_name, description } = await req.json()
  if (!student_id || !command_name || !description) {
    return NextResponse.json({ error: 'student_id, command_name, description required' }, { status: 400 })
  }

  // Normalise: strip leading slash if user included one
  const name = command_name.replace(/^\/+/, '').trim().toLowerCase()
  if (!name) return NextResponse.json({ error: 'command_name is empty' }, { status: 400 })

  const prompt = await generateCommandPrompt(name, description)

  const rows = await db.insert(chatCommands)
    .values({ student_id, command_name: name, description, prompt })
    .returning()
  return NextResponse.json(rows[0], { status: 201 })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors referencing `app/api/commands/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/api/commands/route.ts
git commit -m "feat: add GET/POST /api/commands with AI prompt generation"
```

---

## Task 3: API route — PATCH update + DELETE

**Files:**
- Create: `app/api/commands/[id]/route.ts`

- [ ] **Step 1: Create the route file**

```ts
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { db } from '@/lib/db'
import { chatCommands } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function parseId(id: string) {
  const n = parseInt(id)
  return isNaN(n) ? null : n
}

async function regenerateCommandPrompt(
  commandName: string,
  description: string,
  currentPrompt: string,
): Promise<string> {
  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: `You are generating a system instruction for an AI language tutor.
The user has described a chat command shortcut.
Write a concise, effective system prompt (2–5 sentences) that instructs the AI how to behave when this command is invoked.
Be specific and actionable. Output the prompt text only, no explanation.`,
    prompt: `Command: /${commandName}
Description: ${description}
Current prompt (user may have edited): ${currentPrompt}
Refine or rewrite the prompt based on the updated description.`,
    maxOutputTokens: 256,
  })
  return text.trim()
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseId(id)
  if (!numId) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const { description, prompt: currentPrompt } = await req.json()
  if (!description) return NextResponse.json({ error: 'description required' }, { status: 400 })

  // Fetch existing record to get command_name
  const existing = await db.select().from(chatCommands).where(eq(chatCommands.id, numId)).limit(1)
  if (!existing[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const newPrompt = await regenerateCommandPrompt(
    existing[0].command_name,
    description,
    currentPrompt ?? existing[0].prompt,
  )

  const rows = await db.update(chatCommands)
    .set({ description, prompt: newPrompt })
    .where(eq(chatCommands.id, numId))
    .returning()
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseId(id)
  if (!numId) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  await db.delete(chatCommands).where(eq(chatCommands.id, numId))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/commands/[id]/route.ts
git commit -m "feat: add PATCH/DELETE /api/commands/[id] with AI regeneration"
```

---

## Task 4: i18n strings

**Files:**
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add strings to both locales**

In `lib/i18n.ts`, add these keys inside the `en` object (after `translateRetry`):

```ts
    // Commands
    navCommands:          'Commands',
    commandsHeading:      'Commands',
    newCommand:           'New command',
    commandName:          'Command name',
    commandNameHint:      'No slash needed — it will be added automatically',
    commandDescription:   'Description',
    commandDescHint:      'Describe what this command should do in plain language',
    commandPromptLabel:   'AI prompt',
    commandSave:          'Save & Generate',
    commandUpdate:        'Save & Regenerate',
    commandGenerating:    'Generating…',
    commandDelete:        'Delete',
    commandDeleteConfirm: 'Delete this command?',
    commandCreated:       '✓ Command created',
    commandUpdated:       '✓ Command updated',
    commandNameRequired:  'Command name is required',
    commandDescRequired:  'Description is required',
    commandNetworkError:  'Network error',
    noCommands:           'No commands yet. Create one to get started.',
```

Add the same keys inside the `zh-TW` object:

```ts
    // Commands
    navCommands:          '指令',
    commandsHeading:      '指令',
    newCommand:           '新增指令',
    commandName:          '指令名稱',
    commandNameHint:      '不需要加斜線，系統會自動補上',
    commandDescription:   '描述',
    commandDescHint:      '用白話文描述這個指令應該做什麼',
    commandPromptLabel:   'AI 提示詞',
    commandSave:          '儲存並生成',
    commandUpdate:        '儲存並重新生成',
    commandGenerating:    '生成中…',
    commandDelete:        '刪除',
    commandDeleteConfirm: '確定刪除此指令？',
    commandCreated:       '✓ 指令已建立',
    commandUpdated:       '✓ 指令已更新',
    commandNameRequired:  '指令名稱為必填',
    commandDescRequired:  '描述為必填',
    commandNetworkError:  '網絡錯誤',
    noCommands:           '尚無指令。建立一個開始使用。',
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat: add command i18n strings to both locales"
```

---

## Task 5: Sidebar nav entry

**Files:**
- Modify: `components/sidebar.tsx`

- [ ] **Step 1: Add Terminal icon import**

In `components/sidebar.tsx`, find the lucide imports line and add `Terminal`:

```ts
import { Sun, Moon, LayoutDashboard, BookOpen, MessageCircle, BarChart2, Home, Languages, Terminal } from 'lucide-react'
```

- [ ] **Step 2: Add translations**

In the `T` object, inside `en.nav` add:

```ts
'/commands': 'Commands',
```

Inside `zh-TW.nav` add:

```ts
'/commands': '指令',
```

- [ ] **Step 3: Add nav entry**

In the `NAV` array, add the `/commands` entry between `/chat` and `/progress`:

```ts
const NAV = [
  { href: '/dashboard', Icon: LayoutDashboard },
  { href: '/lessons',   Icon: BookOpen },
  { href: '/chat',      Icon: MessageCircle },
  { href: '/commands',  Icon: Terminal },
  { href: '/progress',  Icon: BarChart2 },
] as const
```

The `T` type is inferred from the `as const` object, so TypeScript will require the nav keys to match. Update the `T` type annotation to include `/commands` — currently `nav` keys are inferred, so adding the string to both locales is sufficient.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat: add /commands nav entry to sidebar"
```

---

## Task 6: Manage commands page

**Files:**
- Create: `app/(app)/commands/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/app/context'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Terminal } from 'lucide-react'

interface Command {
  id: number
  command_name: string
  description: string
  prompt: string
}

export default function CommandsPage() {
  const { currentStudent } = useApp()
  const t = useT()
  const router = useRouter()
  const [commands, setCommands] = useState<Command[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!currentStudent) { setLoading(false); return }
    fetch(`/api/commands?student_id=${currentStudent.id}`)
      .then(r => r.json())
      .then(rows => { setCommands(rows); setLoading(false) })
  }, [currentStudent])

  async function handleDelete(id: number) {
    if (!confirm(t.commandDeleteConfirm)) return
    await fetch(`/api/commands/${id}`, { method: 'DELETE' })
    setCommands(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-semibold leading-tight">{t.commandsHeading}</h1>
        <Button onClick={() => router.push('/commands/new')} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t.newCommand}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : commands.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t.noCommands}</p>
      ) : (
        <div className="space-y-2">
          {commands.map(cmd => (
            <div key={cmd.id}
              className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <Terminal className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-primary">/{cmd.command_name}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{cmd.description}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                  onClick={() => router.push(`/commands/${cmd.id}`)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(cmd.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/commands/page.tsx
git commit -m "feat: add /commands manage list page"
```

---

## Task 7: Create command page

**Files:**
- Create: `app/(app)/commands/new/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/app/context'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewCommandPage() {
  const { currentStudent } = useApp()
  const t = useT()
  const router = useRouter()

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())        { setError(t.commandNameRequired); return }
    if (!description.trim()) { setError(t.commandDescRequired); return }
    if (!currentStudent)     { setError('No student selected'); return }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id:   currentStudent.id,
          command_name: name.trim(),
          description:  description.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t.commandNetworkError); return }
      router.push('/commands')
    } catch {
      setError(t.commandNetworkError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-heading font-semibold leading-tight">{t.newCommand}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t.commandName}</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-sm font-mono">/</span>
            <Input
              value={name}
              onChange={e => setName(e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase())}
              placeholder="polish"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t.commandNameHint}</p>
        </div>

        <div className="space-y-1.5">
          <Label>{t.commandDescription}</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t.commandDescHint}
            disabled={loading}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? t.commandGenerating : t.commandSave}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/commands')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/commands/new/page.tsx"
git commit -m "feat: add /commands/new create command page"
```

---

## Task 8: Edit command page

**Files:**
- Create: `app/(app)/commands/[id]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function EditCommandPage() {
  const { id } = useParams<{ id: string }>()
  const t      = useT()
  const router = useRouter()

  const [description, setDescription] = useState('')
  const [prompt,      setPrompt]      = useState('')
  const [cmdName,     setCmdName]     = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    fetch(`/api/commands/${id}`)
      .then(r => r.json())
      .then(data => {
        setCmdName(data.command_name)
        setDescription(data.description)
        setPrompt(data.prompt)
        setLoadingData(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setError(t.commandDescRequired); return }

    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/commands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), prompt: prompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t.commandNetworkError); return }
      router.push('/commands')
    } catch {
      setError(t.commandNetworkError)
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) return <div className="text-muted-foreground text-sm">Loading…</div>

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-heading font-semibold leading-tight">
        <span className="font-mono text-primary">/{cmdName}</span>
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t.commandDescription}</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={saving}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t.commandPromptLabel}</Label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={saving}
            rows={5}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">Saving will send this to AI to regenerate based on your description.</p>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? t.commandGenerating : t.commandUpdate}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/commands')} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Add GET by ID to the commands [id] API route**

The edit page fetches `GET /api/commands/[id]`. Add this handler to `app/api/commands/[id]/route.ts` (before the `PATCH` function):

```ts
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = parseId(id)
  if (!numId) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  const rows = await db.select().from(chatCommands).where(eq(chatCommands.id, numId)).limit(1)
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/commands/[id]/page.tsx" app/api/commands/\[id\]/route.ts
git commit -m "feat: add /commands/[id] edit page and GET by id"
```

---

## Task 9: Chat API — accept commandPrompt

**Files:**
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Update the route to inject commandPrompt**

Replace the contents of `app/api/chat/route.ts` with:

```ts
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
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
    commandPrompt = '',
  } = await req.json()

  const modelMessages = await convertToModelMessages((messages as UIMessage[]).slice(-50))

  const system = chatSystem(domain as Domain, studentName, lessonContext)
    + (commandPrompt ? `\n\n---\nCommand instructions:\n${commandPrompt}` : '')

  const result = streamText({
    model:           anthropic('claude-haiku-4-5-20251001'),
    system,
    messages:        modelMessages,
    maxOutputTokens: 1024,
  })

  return result.toTextStreamResponse()
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: chat API accepts commandPrompt for silent injection"
```

---

## Task 10: Chat page — autocomplete + command parsing

**Files:**
- Modify: `app/(app)/chat/page.tsx`

This is the largest change. The `ChatInner` component gains:
1. Commands loaded on mount
2. Autocomplete dropdown when input starts with `/`
3. Input parsing on submit to extract `commandName` + `userText`

- [ ] **Step 1: Add command types and fetch to ChatInner**

Replace the entire `app/(app)/chat/page.tsx` with:

```tsx
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { TextStreamChatTransport } from 'ai'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { useApp } from '@/app/context'
import { ChatMessages } from '@/components/chat-messages'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Plus } from 'lucide-react'

interface Command { id: number; command_name: string; description: string; prompt: string }

function dbMessagesToUIMessages(
  dbMsgs: { id: number; role: string; content: string; created_at: string | null }[]
): UIMessage[] {
  return dbMsgs.map(m => ({
    id:    String(m.id),
    role:  m.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: m.content }],
  }))
}

function ChatInner({
  initialMessages,
  conversationId,
  domain,
  studentName,
  studentId,
}: {
  initialMessages: UIMessage[]
  conversationId: number
  domain: string
  studentName: string
  studentId: number
}) {
  const [input, setInput] = useState('')
  const [commands, setCommands] = useState<Command[]>([])
  const [dropdown, setDropdown] = useState<Command[]>([])
  const [dropdownIdx, setDropdownIdx] = useState(0)
  const pendingCommandRef = useRef<string>('')
  const domainRef         = useRef(domain)
  const studentNameRef    = useRef(studentName)

  useEffect(() => { domainRef.current = domain },           [domain])
  useEffect(() => { studentNameRef.current = studentName }, [studentName])

  // Load commands once on mount
  useEffect(() => {
    fetch(`/api/commands?student_id=${studentId}`)
      .then(r => r.json())
      .then(setCommands)
      .catch(() => {/* non-fatal */})
  }, [studentId])

  // Update dropdown as user types
  useEffect(() => {
    if (!input.startsWith('/')) { setDropdown([]); return }
    const typed = input.slice(1).split(' ')[0].toLowerCase()
    const filtered = commands.filter(c => c.command_name.startsWith(typed))
    setDropdown(filtered)
    setDropdownIdx(0)
  }, [input, commands])

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      body: () => ({
        domain:        domainRef.current,
        studentName:   studentNameRef.current,
        lessonContext: '',
        commandPrompt: pendingCommandRef.current,
      }),
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Save assistant message when streaming completes
  const prevStatusRef = useRef(status)
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'ready' && messages.length > 0) {
      const last = messages[messages.length - 1]
      if (last.role === 'assistant') {
        const text = last.parts
          .filter(p => p.type === 'text')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => p.text)
          .join('')
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId, role: 'assistant', content: text }),
        })
      }
    }
    prevStatusRef.current = status
  }, [status, messages, conversationId])

  function selectCommand(cmd: Command) {
    setInput(`/${cmd.command_name} `)
    setDropdown([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Parse command prefix
    let messageText = input
    pendingCommandRef.current = ''

    if (input.startsWith('/')) {
      const parts = input.slice(1).split(' ')
      const cmdName = parts[0].toLowerCase()
      const match = commands.find(c => c.command_name === cmdName)
      if (match) {
        pendingCommandRef.current = match.prompt
        messageText = input  // send full input including /command as visible message
      }
    }

    fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, role: 'user', content: messageText }),
    })
    sendMessage({ text: messageText })
    setInput('')
    setDropdown([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (dropdown.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setDropdownIdx(i => Math.min(i + 1, dropdown.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDropdownIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Tab' || (e.key === 'Enter' && dropdown.length > 0 && !isLoading)) {
      e.preventDefault()
      selectCommand(dropdown[dropdownIdx])
    } else if (e.key === 'Escape') {
      setDropdown([])
    }
  }

  return (
    <div className="flex-1 rounded-xl border bg-card overflow-hidden flex flex-col">
      <ChatMessages messages={messages} isLoading={isLoading} />
      <div className="relative">
        {dropdown.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 mx-4 rounded-lg border bg-popover shadow-md overflow-hidden z-10">
            {dropdown.map((cmd, i) => (
              <button
                key={cmd.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); selectCommand(cmd) }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                  i === dropdownIdx ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <span className="font-mono text-primary font-semibold">/{cmd.command_name}</span>
                <span className="text-muted-foreground truncate">{cmd.description}</span>
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question… or type / for commands"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { currentStudent, domain } = useApp()
  const searchParams = useSearchParams()
  const lessonId = parseInt(searchParams.get('lesson_id') ?? '-1')

  const [ready, setReady]                     = useState(false)
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [conversationId, setConversationId]   = useState<number | null>(null)
  const [chatKey, setChatKey] = useState(0)

  const loadOrCreateConversation = useCallback(async () => {
    if (!currentStudent) return
    setReady(false)

    const params = new URLSearchParams({
      student_id: String(currentStudent.id),
      domain,
      ...(lessonId !== -1 && { lesson_id: String(lessonId) }),
    })
    const res  = await fetch(`/api/chat/history?${params}`)
    const data = await res.json()

    if (data.conversation) {
      setConversationId(data.conversation.id)
      setInitialMessages(dbMessagesToUIMessages(data.messages))
    } else {
      const createRes  = await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: currentStudent.id, domain, lesson_id: lessonId }),
      })
      const createData = await createRes.json()
      setConversationId(createData.conversation.id)
      setInitialMessages([])
    }

    setReady(true)
  }, [currentStudent, domain, lessonId])

  useEffect(() => { loadOrCreateConversation() }, [loadOrCreateConversation])

  const handleNewConversation = async () => {
    if (!currentStudent) return
    const res  = await fetch('/api/chat/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: currentStudent.id, domain, lesson_id: lessonId }),
    })
    const data = await res.json()
    setConversationId(data.conversation.id)
    setInitialMessages([])
    setChatKey(k => k + 1)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-3xl font-heading font-semibold leading-tight">Ask Sensei</h1>
        <Button variant="outline" size="sm" onClick={handleNewConversation}>
          <Plus className="h-4 w-4 mr-1" />
          New conversation
        </Button>
      </div>
      {!ready || conversationId === null ? (
        <div className="flex-1 rounded-xl border bg-card flex items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : (
        <ChatInner
          key={chatKey}
          initialMessages={initialMessages}
          conversationId={conversationId}
          domain={domain}
          studentName={currentStudent?.name ?? 'Student'}
          studentId={currentStudent?.id ?? 0}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Smoke test**

```bash
npm run dev
```

1. Open `/commands` — should show empty state with "New command" button
2. Create a command (e.g. `/polish`, "Polish my sentence to sound more natural")
3. After ~5s redirect to list — command appears
4. Open `/chat`, type `/pol` — dropdown shows `/polish`
5. Select it, type `i go to school by bus`, send — AI responds polishing the sentence

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/chat/page.tsx"
git commit -m "feat: add /command autocomplete and silent prompt injection to chat"
```

---

## Task 11: Add .superpowers to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add entry**

Open `.gitignore` and add:

```
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm directory"
```
