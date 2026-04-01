# Chat History Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist per-student, per-scope chat history to PostgreSQL so conversations survive navigation and page refresh.

**Architecture:** Two new tables (`chat_conversations`, `chat_messages`) store threads scoped by (student_id, domain, lesson_id). Three new API routes handle reading/writing. The chat page loads history on mount via `initialMessages`, saves each message after send/stream, and offers a "New conversation" button. The existing streaming route is untouched.

**Tech Stack:** Drizzle ORM (postgres.js), Next.js Route Handlers, AI SDK v6 `useChat` (`@ai-sdk/react`), React `useEffect`/`useState`.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/db/schema.ts` | Add `chat_conversations` + `chat_messages` tables |
| Create | `app/api/chat/history/route.ts` | GET (fetch active thread) + POST (create/archive) |
| Create | `app/api/chat/message/route.ts` | POST (save single message) |
| Modify | `app/(app)/chat/page.tsx` | Load history, persist messages, New Conversation button |
| Modify | `components/lesson-viewer.tsx` | Add `lesson_id` to AskSenseiBtn URL |

---

## Task 1: Add DB tables

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add the two new tables to the schema**

Open `lib/db/schema.ts`. Add after the existing `progress` table:

```ts
import {
  pgTable, serial, text, integer, timestamp, jsonb, unique,
  boolean, uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
```

Replace the existing import line (it currently imports `pgTable, serial, text, integer, timestamp, jsonb, unique`) with the expanded import above, then append at the bottom of the file:

```ts
export const chatConversations = pgTable('chat_conversations', {
  id:         serial('id').primaryKey(),
  student_id: integer('student_id').notNull().references(() => students.id),
  domain:     text('domain').notNull(),
  lesson_id:  integer('lesson_id').notNull().default(-1), // -1 = general domain thread
  is_active:  boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => ({
  // Partial unique index: only one active conversation per (student, domain, lesson) scope
  activeUnique: uniqueIndex('chat_conv_active_unique')
    .on(t.student_id, t.domain, t.lesson_id)
    .where(sql`${t.is_active} = true`),
}))

export const chatMessages = pgTable('chat_messages', {
  id:               serial('id').primaryKey(),
  conversation_id:  integer('conversation_id').notNull().references(() => chatConversations.id),
  role:             text('role').notNull(), // 'user' | 'assistant'
  content:          text('content').notNull(),
  created_at:       timestamp('created_at').defaultNow(),
})

export type ChatConversation = typeof chatConversations.$inferSelect
export type ChatMessage      = typeof chatMessages.$inferSelect
```

- [ ] **Step 2: Push the schema to the database**

```bash
cd /Users/tungsanlee/Documents/Japanese-study/japanese-platform-next
npx drizzle-kit push
```

Expected output: lines like `[✓] chat_conversations`, `[✓] chat_messages` — no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add chat_conversations and chat_messages tables"
```

---

## Task 2: GET /api/chat/history — fetch active thread

**Files:**
- Create: `app/api/chat/history/route.ts`

- [ ] **Step 1: Verify the route doesn't exist yet**

```bash
ls app/api/chat/
```

Expected: only `route.ts` (the streaming route). No `history/` directory.

- [ ] **Step 2: Create the route**

Create `app/api/chat/history/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chatConversations, chatMessages } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id')
  const domain    = searchParams.get('domain')
  const lessonId  = parseInt(searchParams.get('lesson_id') ?? '-1')

  if (!studentId || !domain) {
    return NextResponse.json({ error: 'student_id and domain required' }, { status: 400 })
  }

  const numStudentId = parseInt(studentId)
  if (isNaN(numStudentId)) {
    return NextResponse.json({ error: 'invalid student_id' }, { status: 400 })
  }

  const conversation = await db
    .select()
    .from(chatConversations)
    .where(
      and(
        eq(chatConversations.student_id, numStudentId),
        eq(chatConversations.domain, domain),
        eq(chatConversations.lesson_id, lessonId),
        eq(chatConversations.is_active, true),
      )
    )
    .limit(1)
    .then(rows => rows[0] ?? null)

  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [] })
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversation_id, conversation.id))
    .orderBy(asc(chatMessages.created_at))

  return NextResponse.json({ conversation, messages })
}
```

- [ ] **Step 3: Verify with curl (start the dev server first if not running)**

```bash
# General thread (lesson_id defaults to -1)
curl "http://localhost:3000/api/chat/history?student_id=1&domain=japanese"
```

Expected: `{"conversation":null,"messages":[]}` (no conversations yet).

```bash
# Missing params
curl "http://localhost:3000/api/chat/history?domain=japanese"
```

Expected: `{"error":"student_id and domain required"}` with status 400.

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/history/route.ts
git commit -m "feat: add GET /api/chat/history route"
```

---

## Task 3: POST /api/chat/history — create / archive conversation

**Files:**
- Modify: `app/api/chat/history/route.ts`

- [ ] **Step 1: Add the POST handler to the same file**

Append to `app/api/chat/history/route.ts` (after the GET export):

```ts
export async function POST(req: Request) {
  const { student_id, domain, lesson_id = -1 } = await req.json()

  if (!student_id || !domain) {
    return NextResponse.json({ error: 'student_id and domain required' }, { status: 400 })
  }

  // Archive any existing active conversation for this scope
  await db
    .update(chatConversations)
    .set({ is_active: false })
    .where(
      and(
        eq(chatConversations.student_id, student_id),
        eq(chatConversations.domain, domain),
        eq(chatConversations.lesson_id, lesson_id),
        eq(chatConversations.is_active, true),
      )
    )

  // Create the new active conversation
  const [conversation] = await db
    .insert(chatConversations)
    .values({ student_id, domain, lesson_id, is_active: true })
    .returning()

  return NextResponse.json({ conversation })
}
```

- [ ] **Step 2: Verify — create a conversation**

```bash
curl -s -X POST http://localhost:3000/api/chat/history \
  -H "Content-Type: application/json" \
  -d '{"student_id":1,"domain":"japanese"}' | jq .
```

Expected: `{ "conversation": { "id": 1, "student_id": 1, "domain": "japanese", "lesson_id": -1, "is_active": true, ... } }`

- [ ] **Step 3: Verify — GET now returns the conversation**

```bash
curl "http://localhost:3000/api/chat/history?student_id=1&domain=japanese" | jq .
```

Expected: `{ "conversation": { "id": 1, ... }, "messages": [] }`

- [ ] **Step 4: Verify — creating again archives the old one**

```bash
# Create a second conversation
curl -s -X POST http://localhost:3000/api/chat/history \
  -H "Content-Type: application/json" \
  -d '{"student_id":1,"domain":"japanese"}' | jq .
```

Expected: new conversation with `id: 2`. Previous conversation with `id: 1` is now `is_active: false` (verify by checking the DB or that GET returns id 2).

```bash
curl "http://localhost:3000/api/chat/history?student_id=1&domain=japanese" | jq '.conversation.id'
```

Expected: `2`

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/history/route.ts
git commit -m "feat: add POST /api/chat/history route"
```

---

## Task 4: POST /api/chat/message — save a message

**Files:**
- Create: `app/api/chat/message/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/chat/message/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chatMessages } from '@/lib/db/schema'

export async function POST(req: Request) {
  const { conversation_id, role, content } = await req.json()

  if (!conversation_id || !role || !content) {
    return NextResponse.json(
      { error: 'conversation_id, role, and content required' },
      { status: 400 }
    )
  }

  if (role !== 'user' && role !== 'assistant') {
    return NextResponse.json({ error: 'role must be user or assistant' }, { status: 400 })
  }

  const [message] = await db
    .insert(chatMessages)
    .values({ conversation_id, role, content })
    .returning()

  return NextResponse.json({ message })
}
```

- [ ] **Step 2: Verify — save a user message**

```bash
# Use the conversation id returned in Task 3 Step 5 (adjust id as needed)
curl -s -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":2,"role":"user","content":"What does 食べる mean?"}' | jq .
```

Expected: `{ "message": { "id": 1, "conversation_id": 2, "role": "user", "content": "What does 食べる mean?", ... } }`

- [ ] **Step 3: Verify — GET history now includes the message**

```bash
curl "http://localhost:3000/api/chat/history?student_id=1&domain=japanese" | jq '.messages'
```

Expected: array with one message: `[{ "role": "user", "content": "What does 食べる mean?", ... }]`

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/message/route.ts
git commit -m "feat: add POST /api/chat/message route"
```

---

## Task 5: Chat page — load history on mount + persist messages

**Files:**
- Modify: `app/(app)/chat/page.tsx`

`★ Insight ─────────────────────────────────────`
`useChat`'s `initialMessages` is consumed only once at hook creation time. Since history is fetched async, we delay rendering the chat until history loads — then pass it as `initialMessages`. This avoids the complexity of a `setMessages` call after render and keeps the hook's internal state consistent.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Rewrite the chat page**

Replace the full contents of `app/(app)/chat/page.tsx` with:

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

const MAX_MODEL_MESSAGES = 50

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
  onNewConversation,
}: {
  initialMessages: UIMessage[]
  conversationId: number
  domain: string
  studentName: string
  onNewConversation: () => void
}) {
  const searchParams  = useSearchParams()
  const [input, setInput] = useState(() => searchParams.get('q') ?? '')
  const domainRef      = useRef(domain)
  const studentNameRef = useRef(studentName)
  useEffect(() => { domainRef.current = domain },       [domain])
  useEffect(() => { studentNameRef.current = studentName }, [studentName])

  const { messages, sendMessage, status } = useChat({
    initialMessages,
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      body: () => ({
        domain:        domainRef.current,
        studentName:   studentNameRef.current,
        lessonContext: '',
        // Cap to last 50 messages for model context
        messages:      messages.slice(-MAX_MODEL_MESSAGES),
      }),
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Track the previous status to detect streaming completion
  const prevStatusRef = useRef(status)
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'idle' && messages.length > 0) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    // Save user message immediately
    fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, role: 'user', content: input }),
    })
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex-1 rounded-xl border bg-card overflow-hidden flex flex-col">
      <ChatMessages messages={messages} isLoading={isLoading} />
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question…"
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

export default function ChatPage() {
  const { currentStudent, domain } = useApp()
  const searchParams = useSearchParams()
  const lessonId = parseInt(searchParams.get('lesson_id') ?? '-1')

  const [ready, setReady] = useState(false)
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  // key forces ChatInner to remount (and useChat to reinitialize) on new conversation
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
      // No active conversation — create one
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
    setChatKey(k => k + 1) // remount ChatInner with empty messages
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-xl font-bold">Ask Sensei</h1>
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
          onNewConversation={handleNewConversation}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Start the dev server and navigate to `/chat`**

```bash
npm run dev
```

Open `http://localhost:3000/chat`. Expected:
- Page loads showing "Loading…" briefly, then the chat UI
- If messages were saved in Task 4 Step 2, they appear in the conversation

- [ ] **Step 3: Verify message persistence**

1. Type a message and press Send
2. Navigate away (e.g., go to Dashboard)
3. Navigate back to `/chat`
4. The conversation (both your message and the AI reply) should reappear

- [ ] **Step 4: Verify New Conversation button**

Click "New conversation". Expected:
- The chat clears to empty
- Old messages are gone (they are archived in DB, not deleted)
- Typing and sending a new message works normally

- [ ] **Step 5: Commit**

```bash
git add app/(app)/chat/page.tsx
git commit -m "feat: load and persist chat history per student scope"
```

---

## Task 6: Add lesson_id to AskSenseiBtn

**Files:**
- Modify: `components/lesson-viewer.tsx`

- [ ] **Step 1: Read the AskSenseiBtn and LessonViewerProps**

The `AskSenseiBtn` at line 9–21 of `components/lesson-viewer.tsx` currently navigates to `/chat?q=...`. The `LessonViewerProps` at line 23 includes `lesson.id`.

- [ ] **Step 2: Update AskSenseiBtn to accept and forward the lesson id**

Change `AskSenseiBtn` to accept a `lessonId` prop and append it to the URL:

```tsx
function AskSenseiBtn({ content, lessonId }: { content: string; lessonId: number }) {
  const router = useRouter()
  const q = encodeURIComponent(`Please dive deeper and explain: "${content}"`)
  return (
    <button
      onClick={() => router.push(`/chat?q=${q}&lesson_id=${lessonId}`)}
      title="Ask Sensei"
      className="ml-1.5 inline-flex items-center text-muted-foreground hover:text-primary transition-colors align-middle"
    >
      <MessageCircle className="h-3.5 w-3.5" />
    </button>
  )
}
```

- [ ] **Step 3: Pass lessonId at all call sites**

In `lesson-viewer.tsx`, all `<AskSenseiBtn content={...} />` calls need `lessonId={lesson.id}`. There are currently 4 call sites (lines 125, 146, 150, 154 approximately — verify by reading the file). Update each one:

```tsx
<AskSenseiBtn content={v.word}        lessonId={lesson.id} />
<AskSenseiBtn content={g.pattern}     lessonId={lesson.id} />
<AskSenseiBtn content={g.explanation} lessonId={lesson.id} />
<AskSenseiBtn content={g.example}     lessonId={lesson.id} />
// and in worked examples section if present:
<AskSenseiBtn content={ex}            lessonId={lesson.id} />
```

- [ ] **Step 4: Verify in the browser**

1. Open any lesson
2. Click a `MessageCircle` button next to a vocabulary word
3. Confirm the URL is `/chat?q=...&lesson_id=<number>`
4. Confirm the chat page loads a lesson-scoped thread (separate from the general `/chat` thread)
5. Send a message, navigate away, come back — the lesson thread persists

- [ ] **Step 5: Commit**

```bash
git add components/lesson-viewer.tsx
git commit -m "feat: scope AskSenseiBtn chats to lesson thread"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Persist history to PostgreSQL per student | Task 1, 2, 3, 4 |
| Scope: general domain thread | Task 2/3 (lesson_id=-1 default), Task 5 |
| Scope: lesson thread when from lesson viewer | Task 6 |
| "New conversation" archives + starts fresh | Task 5 (handleNewConversation) |
| Full history in UI, last 50 to model | Task 5 (ChatInner body callback slices to 50) |

**Type consistency check:**

- `ChatConversation` / `ChatMessage` defined in Task 1, used in routes (Tasks 2–4)
- `dbMessagesToUIMessages` converts `{ id, role, content, created_at }` → `UIMessage[]` in Task 5
- `conversationId: number` threaded from page state → `ChatInner` → fetch calls — consistent throughout
- `lesson_id: number` defaults to `-1` consistently across GET params, POST body, and URL parsing
