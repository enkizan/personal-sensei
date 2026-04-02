# Math Domain Chinese Translation — Design Spec

**Date:** 2026-04-02
**Scope:** Math domain only
**Author:** Enki + Claude

---

## Overview

Math lessons in the `math` domain will store a full Traditional Chinese (繁體中文) translation alongside the existing English content. Chinese version is generated automatically when a lesson is created and can also be generated on-demand when a student switches the UI to ZH mode.

---

## 1. Database

**Change:** Add a single nullable column `content_zh JSONB` to the `lessons` table.

- `NULL` = no Chinese version exists yet
- Non-null = full translated lesson content in the same schema as `content`
- No new tables required

```sql
ALTER TABLE lessons ADD COLUMN content_zh JSONB;
```

In `lib/db/schema.ts`:
```ts
contentZh: jsonb('content_zh'),
```

This column is only semantically meaningful for `domain = 'math'` lessons, but storing it on the shared table is simplest — other domains leave it `NULL`.

---

## 2. Lesson Generation (Admin Flow)

**Route:** `POST /api/generate-lesson`

After the existing English lesson is generated and saved, make a second `generateObject` call:

- **Model:** `claude-sonnet-4-6`
- **Input:** The English `content` JSON as source material
- **Prompt:** Translate to Traditional Chinese; preserve all mathematical notation, formulas, and numbers exactly; output must match the same `MathLessonSchema`
- **Output:** Saved to `content_zh` on the same lesson row

**Failure handling:** If the ZH generation call fails, the lesson is saved with `content_zh = NULL`. No rollback. The lesson is still fully usable in English. The student can trigger lazy generation later.

**Latency:** Two sequential `generateObject` calls. EN first (~15–20s), ZH second (~15–20s). Total ~30–40s in Admin — acceptable since this is a teacher-facing action.

---

## 3. Lazy Generation (Student Flow)

**Route:** `POST /api/lessons/[id]/translate-zh`

Triggered when a student switches `uiLang` to `'zh-TW'` and `content_zh` is `null`.

Steps:
1. Fetch lesson by ID
2. If `content_zh` already exists, return it immediately (idempotent)
3. Call `generateObject` with the same translation prompt and schema
4. `UPDATE lessons SET content_zh = $1 WHERE id = $2`
5. Return `{ content_zh }`

**Error handling:** Return 500 with error message. UI shows an error state with a "Retry" option.

---

## 4. Lesson Viewer UI

**File:** `components/lesson-viewer.tsx`

**Type change:** Add `content_zh?: MathLesson | null` to the lesson prop type.

**Rendering logic:**

When `uiLang === 'zh-TW'` (math domain only):

| State | UI |
|---|---|
| `content_zh` present | Render ZH fields |
| `content_zh` is `null`, not loading | Trigger lazy fetch, show spinner |
| Loading | Spinner in content area |
| Error | Error message + Retry button |

**Fields switched to ZH version:**
- `title`
- `content` (narrative text)
- `concepts[].name`, `concepts[].definition`, `concepts[].example`
- `worked_examples[].problem`, `worked_examples[].solution`, `worked_examples[].steps[]`
- `quiz[].question`, `quiz[].options[]`, `quiz[].explanation`
- `tips`

**Fields unchanged between EN/ZH:** math notation, numbers, answer indices. The `answer` field in quiz items is an index — identical in both versions.

**Tab structure:** Unchanged. Content / Concepts / Examples / Quiz / Tips tabs exist in both languages.

**Quiz engine:** Receives the ZH quiz array when in ZH mode. Scoring logic is unaffected (index-based answers).

---

## 5. Data Flow Diagram

```
Admin generates lesson
  → generateObject (EN)  → lessons.content = {...}
  → generateObject (ZH)  → lessons.content_zh = {...}

Student views lesson (uiLang = 'zh-TW')
  → content_zh present?
      YES → render ZH fields
      NO  → POST /api/lessons/[id]/translate-zh
              → generateObject (ZH)
              → UPDATE lessons SET content_zh
              → return content_zh
              → render ZH fields
```

---

## 6. Scope Boundaries

- **Math domain only.** Japanese, English, French lessons are unaffected.
- **No schema changes to other domains.**
- **No UI changes outside `lesson-viewer.tsx` and `generate-lesson/route.ts`.**
- **No changes to quiz scoring, progress tracking, or chat.**
