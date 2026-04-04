# Chat Commands — Design Spec

**Date:** 2026-04-04  
**Feature:** `/command` shortcuts for the Ask Sensei chat  
**Status:** Approved

---

## Overview

Users can create named `/command` shortcuts that inject an AI-generated system prompt silently into a chat turn. For example, typing `/polish i go to school by bus` runs the sentence through a polishing prompt without the user having to retype instructions every time.

---

## Data Model

New table added to `lib/db/schema.ts`:

```ts
chat_commands (
  id            serial PRIMARY KEY
  student_id    integer NOT NULL → students.id
  command_name  text    NOT NULL   -- stored without slash, e.g. "polish"
  description   text    NOT NULL   -- user-written intent
  prompt        text    NOT NULL   -- AI-generated system instruction
  created_at    timestamp DEFAULT now()
  UNIQUE(student_id, command_name)
)
```

- `command_name` stored without the `/` prefix; slash added in UI only
- `prompt` is what gets silently injected into the chat API on invocation
- Unique constraint prevents duplicate command names per student

---

## Pages & Routes

### App pages

```
app/(app)/
  commands/
    page.tsx          ← Manage list
    new/
      page.tsx        ← Create form
    [id]/
      page.tsx        ← Edit form
```

### API routes

```
app/api/
  commands/
    route.ts          ← GET (list by student_id) · POST (create + AI generate)
    [id]/
      route.ts        ← PATCH (update + AI regenerate) · DELETE
```

### Sidebar nav

New entry added between Chat and Progress in `components/sidebar.tsx`:

```
/dashboard   Dashboard / 儀表板
/lessons     Lessons / 課程
/chat        Ask Sensei / 問老師
/commands    Commands / 指令        ← new  (icon: Terminal from lucide-react)
/progress    Progress / 進度
```

i18n keys added to `lib/i18n.ts` for both `en` and `zh-TW`.

---

## Page Behaviour

### `/commands` — Manage list

- Fetches `GET /api/commands?student_id=X`
- Renders a table: command name · description · Edit button · Delete button
- "New command" button links to `/commands/new`
- Delete calls `DELETE /api/commands/[id]` with confirmation

### `/commands/new` — Create form

Fields:
- **Command name** — text input, no slash prefix (added automatically)
- **Description** — textarea, user explains the intent in plain language

On submit:
1. POST `/api/commands` with `{ student_id, command_name, description }`
2. API calls AI (Haiku) to generate `prompt` from `description`
3. Saves row, returns created command
4. Redirects to `/commands`

### `/commands/[id]` — Edit form

- Pre-filled with existing `command_name`, `description`, and current `prompt`
- Both `description` and `prompt` are editable
- On save: PATCH `/api/commands/[id]` with updated fields
- API always calls AI to regenerate `prompt` based on the updated `description` (and any manual edits to `prompt` are passed as context)
- Redirects to `/commands`

---

## AI Prompt Generation

**Model:** `claude-haiku-4-5-20251001` (same as chat/dive — fast, low cost)

**System message for generation:**
```
You are generating a system instruction for an AI language tutor.
The user has described a chat command shortcut. 
Write a concise, effective system prompt (2–5 sentences) that instructs 
the AI how to behave when this command is invoked. 
Be specific and actionable. Output the prompt text only, no explanation.
```

**User message for generation:**
```
Command: /{command_name}
Description: {description}
```

**On edit/regenerate**, pass the current manual prompt as additional context:
```
Command: /{command_name}
Description: {description}
Current prompt (user may have edited): {current_prompt}
Refine or rewrite the prompt based on the updated description.
```

Use `generateText` (not `generateObject`) — the output is a plain text string.

---

## Chat Integration

### Autocomplete

- Commands fetched once on chat page mount via `GET /api/commands?student_id=X`, cached in component state (skipped if no student selected — dropdown simply stays empty)
- Dropdown triggers when input value starts with `/`
- Filters client-side as user types (`/po` → `/polish`, `/practice`)
- Keyboard: arrow keys to navigate, `Enter` or click to select
- Selection inserts `/command_name ` (with trailing space) into input
- `Escape` or outside click dismisses dropdown

### Invocation

Input format: `/command_name [optional user text]`

Example: `/polish i go to school by bus`

**On submit:**
1. If input starts with a known command name → parse into `commandName` + `userText`
2. Look up `prompt` from cached commands
3. Send to `/api/chat` with extra body field `commandPrompt: string`
4. If input starts with `/` but no matching command → treat as plain message

**What shows in chat history:**
```
[user]      /polish i go to school by bus     ← full input preserved
[assistant] "I go to school by bus." ✓ ...
```

### Chat API change

`app/api/chat/route.ts` accepts optional `commandPrompt` in the request body:

```ts
const { messages, domain, studentName, lessonContext, commandPrompt = '' } = await req.json()

const system = chatSystem(domain, studentName, lessonContext)
             + (commandPrompt ? `\n\n---\nCommand instructions:\n${commandPrompt}` : '')
```

The injection is single-turn only — `commandPrompt` is cleared in the client after each send.

---

## i18n

New keys to add in `lib/i18n.ts` for both `en` and `zh-TW`:

| Key | en | zh-TW |
|---|---|---|
| `navCommands` | `Commands` | `指令` |
| `commandsHeading` | `Commands` | `指令` |
| `newCommand` | `New command` | `新增指令` |
| `commandName` | `Command name` | `指令名稱` |
| `commandDescription` | `Description` | `描述` |
| `commandPromptLabel` | `AI prompt` | `AI 提示詞` |
| `commandSave` | `Save & Generate` | `儲存並生成` |
| `commandUpdate` | `Save & Regenerate` | `儲存並重新生成` |
| `commandGenerating` | `Generating…` | `生成中…` |
| `commandDelete` | `Delete` | `刪除` |
| `commandDeleteConfirm` | `Delete this command?` | `確定刪除此指令？` |

---

## Out of Scope (v1)

- Domain-scoped commands (all commands available regardless of active domain)
- Command arguments / variable substitution (e.g. `/translate {word}`)
- Shared/global commands across students
- Command usage history or analytics
