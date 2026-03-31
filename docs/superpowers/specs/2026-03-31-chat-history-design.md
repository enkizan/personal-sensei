# Chat History Persistence — Design Spec

**Date:** 2026-03-31
**Feature:** Per-user, per-scope persistent chat history for Ask Sensei

---

## Problem

The `useChat` hook holds messages in React state only. Every navigation or page refresh wipes the entire conversation. There is no isolation between students — if two students used the same browser session they would share history (no DB persistence at all).

---

## Goals

- Persist chat history to PostgreSQL per student
- Scope threads: one thread per (student × domain) for general chat; a separate thread per (student × domain × lesson) when launched from a lesson
- "New conversation" archives the current thread and starts a fresh one
- Full history shown in UI; only the last 50 messages sent to the model (token cost cap)

---

## Data Model

Two new Drizzle tables added to `lib/db/schema.ts`:

```ts
chat_conversations (
  id          serial PRIMARY KEY
  student_id  integer NOT NULL  → students.id
  domain      text NOT NULL     -- 'japanese' | 'english' | 'french' | 'math'
  lesson_id   integer NOT NULL DEFAULT -1  -- -1 = general domain thread (NULL breaks UNIQUE)
  is_active   boolean DEFAULT true
  created_at  timestamp DEFAULT now()
  UNIQUE(student_id, domain, lesson_id, is_active)
)

chat_messages (
  id               serial PRIMARY KEY
  conversation_id  integer NOT NULL → chat_conversations.id
  role             text NOT NULL    -- 'user' | 'assistant'
  content          text NOT NULL
  created_at       timestamp DEFAULT now()
)
```

`lesson_id = -1` is the sentinel for a general domain thread (using `NULL` would break the `UNIQUE` constraint in Postgres since `NULL != NULL`). A positive `lesson_id` means a lesson-scoped thread launched from the lesson viewer. The unique constraint ensures only one active thread per scope at any time.

---

## API Routes

All routes live under `app/api/chat/`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chat/history` | Fetch active conversation + messages for a scope. Query params: `student_id`, `domain`, `lesson_id` (optional). Returns `{ conversation, messages }` or `{ conversation: null, messages: [] }`. |
| `POST` | `/api/chat/history` | Create a new active conversation for a scope. Sets previous active conversation `is_active=false` first. Body: `{ student_id, domain, lesson_id? }`. Returns `{ conversation }`. |
| `POST` | `/api/chat/message` | Save a single message. Body: `{ conversation_id, role, content }`. Returns `{ message }`. |

The existing `POST /api/chat` streaming route is **not modified**. Persistence is handled as a separate concern so the streaming path has no added latency.

---

## Client Integration

### `app/(app)/chat/page.tsx`

1. **On mount** — read `student_id` from `currentStudent`, `domain` from context, `lesson_id` from `?lesson_id=` search param. Call `GET /api/chat/history`. If a conversation exists, set as `initialMessages` for `useChat`. If none, call `POST /api/chat/history` to create one.

2. **Saving messages** — after `sendMessage`, immediately call `POST /api/chat/message` with the user message. Watch `status`: when it transitions from `streaming` to a settled state, save the last assistant message.

3. **Model context cap** — slice `messages` to the last 50 before passing to the transport `body` callback. The full array is still displayed in the UI.

4. **"New conversation" button** — calls `POST /api/chat/history` (archives old thread, creates new), then resets local `useChat` state to `[]`.

### `components/lesson-viewer.tsx` — `AskSenseiBtn`

Append `&lesson_id=<lessonId>` to the `/chat?q=...` navigation URL so the chat page opens the lesson-scoped thread.

---

## Conversation Scoping Logic

```
scope key = (student_id, domain, lesson_id)
  lesson_id = -1    → general "Ask Sensei" thread for this domain
  lesson_id = 42    → thread tied to lesson 42
```

When `AskSenseiBtn` is clicked inside a lesson, the chat page receives `lesson_id` and loads/creates the lesson-scoped thread. Navigating directly to `/chat` (no `lesson_id`) loads the general domain thread.

---

## Out of Scope

- Browsing / restoring archived conversations (could be a future "history" panel)
- Message editing or deletion
- Cross-device sync (single Neon DB handles this implicitly)
