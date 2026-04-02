# Dark Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Boot.dev-inspired dark-first design to the entire app — deep navy palette, gold accent, Noto Serif JP headings, tighter radius, and polished component spacing.

**Architecture:** All visual tokens live in `globals.css`. Dark is the new default (`:root` holds dark vars; `.dark` mirrors them for next-themes compatibility; `.light` holds the light overrides). Typography, spacing, and component changes cascade from there with minimal per-file edits.

**Tech Stack:** Tailwind CSS v4, shadcn/Base UI components, next-themes, Noto Serif JP (already loaded via Google Fonts).

---

## File Map

| File | What changes |
|------|-------------|
| `app/globals.css` | Full token rewrite — dark default palette, gold primary, heading font token, `@layer base` h1/h2/h3 rule, trimmed domain blocks |
| `app/layout.tsx` | `defaultTheme="dark"` on ThemeProvider |
| `app/(app)/layout.tsx` | `p-6` → `p-8` on `<main>` |
| `components/ui/button.tsx` | Default variant: dark-amber bg + gold border + `tracking-wide` |
| `components/lesson-card.tsx` | `border-l-4 border-primary`, `py-5`, `font-heading` topic text |
| `components/sidebar.tsx` | Active nav item: `border-l-2 border-white/70` left accent |
| `app/(app)/dashboard/page.tsx` | `space-y-10`, `gap-6`, stat numbers `text-4xl font-sans`, labels `tracking-widest uppercase` |
| `app/(app)/lessons/page.tsx` | h1 → `text-3xl font-heading font-semibold`, `space-y-10` |
| `app/(app)/chat/page.tsx` | h1 → `text-3xl font-heading font-semibold` |
| `app/(app)/progress/page.tsx` | h1 → `text-3xl font-heading font-semibold`, `space-y-6` → `space-y-10` |

---

## Task 1: globals.css — Dark-first color tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the entire `:root` block with dark-first variables**

Replace the existing `:root { ... }` block (lines 57–109) with:

```css
/* ── Dark mode (default) ───────────────────────────────────────────────────── */
:root {
  --background:             oklch(0.18 0.02 264);
  --foreground:             oklch(0.93 0.01 240);
  --card:                   oklch(0.22 0.02 264);
  --card-foreground:        oklch(0.93 0.01 240);
  --popover:                oklch(0.22 0.02 264);
  --popover-foreground:     oklch(0.93 0.01 240);
  --primary:                oklch(0.72 0.14 80);
  --primary-foreground:     oklch(0.15 0.03 80);
  --secondary:              oklch(0.25 0.02 264);
  --secondary-foreground:   oklch(0.93 0.01 240);
  --muted:                  oklch(0.25 0.02 264);
  --muted-foreground:       oklch(0.65 0.02 240);
  --accent:                 oklch(0.25 0.02 264);
  --accent-foreground:      oklch(0.93 0.01 240);
  --destructive:            oklch(0.704 0.191 22);
  --success:                oklch(0.380 0.120 150);
  --success-bg:             oklch(0.200 0.040 150);
  --warning:                oklch(0.720 0.140 80);
  --warning-bg:             oklch(0.220 0.040 80);
  --border:                 oklch(0.30 0.02 264);
  --input:                  oklch(0.30 0.02 264);
  --ring:                   oklch(0.72 0.14 80);
  --radius:                 0.375rem;

  --sidebar:                      oklch(0.175 0.040 264);
  --sidebar-foreground:           oklch(0.985 0 0);
  --sidebar-primary:              oklch(0.72 0.14 80);
  --sidebar-primary-foreground:   oklch(0.15 0.03 80);
  --sidebar-accent:               oklch(0.230 0.050 264);
  --sidebar-accent-foreground:    oklch(0.985 0 0);
  --sidebar-border:               oklch(1 0 0 / 10%);
  --sidebar-ring:                 oklch(1 0 0 / 20%);
}
```

- [ ] **Step 2: Replace the `.dark` block — mirror `:root` for next-themes compatibility**

Replace the existing `.dark { ... }` block (lines 112–141) with:

```css
/* ── Dark class (mirrors :root — next-themes adds .dark to <html> when defaultTheme="dark") */
.dark {
  --background:             oklch(0.18 0.02 264);
  --foreground:             oklch(0.93 0.01 240);
  --card:                   oklch(0.22 0.02 264);
  --card-foreground:        oklch(0.93 0.01 240);
  --popover:                oklch(0.22 0.02 264);
  --popover-foreground:     oklch(0.93 0.01 240);
  --primary:                oklch(0.72 0.14 80);
  --primary-foreground:     oklch(0.15 0.03 80);
  --secondary:              oklch(0.25 0.02 264);
  --secondary-foreground:   oklch(0.93 0.01 240);
  --muted:                  oklch(0.25 0.02 264);
  --muted-foreground:       oklch(0.65 0.02 240);
  --accent:                 oklch(0.25 0.02 264);
  --accent-foreground:      oklch(0.93 0.01 240);
  --destructive:            oklch(0.704 0.191 22);
  --border:                 oklch(0.30 0.02 264);
  --input:                  oklch(0.30 0.02 264);
  --ring:                   oklch(0.72 0.14 80);
  --sidebar:                      oklch(0.175 0.040 264);
  --sidebar-foreground:           oklch(0.985 0 0);
  --sidebar-primary:              oklch(0.72 0.14 80);
  --sidebar-primary-foreground:   oklch(0.15 0.03 80);
  --sidebar-accent:               oklch(0.230 0.050 264);
  --sidebar-accent-foreground:    oklch(0.985 0 0);
  --sidebar-border:               oklch(1 0 0 / 10%);
  --sidebar-ring:                 oklch(1 0 0 / 20%);
}
```

- [ ] **Step 3: Add `.light` block after `.dark`**

Add this new block immediately after the `.dark` block:

```css
/* ── Light mode (opt-in via toggle) ───────────────────────────────────────── */
.light {
  --background:             oklch(0.972 0.007 75);
  --foreground:             oklch(0.149 0 0);
  --card:                   oklch(1 0 0);
  --card-foreground:        oklch(0.149 0 0);
  --popover:                oklch(1 0 0);
  --popover-foreground:     oklch(0.149 0 0);
  --primary:                oklch(0.58 0.14 80);
  --primary-foreground:     oklch(0.985 0 0);
  --secondary:              oklch(0.945 0.010 80);
  --secondary-foreground:   oklch(0.149 0 0);
  --muted:                  oklch(0.913 0.012 80);
  --muted-foreground:       oklch(0.530 0 0);
  --accent:                 oklch(0.945 0.010 80);
  --accent-foreground:      oklch(0.149 0 0);
  --destructive:            oklch(0.498 0.220 27);
  --success:                oklch(0.380 0.120 150);
  --success-bg:             oklch(0.940 0.040 150);
  --warning:                oklch(0.480 0.130 60);
  --warning-bg:             oklch(0.950 0.040 80);
  --border:                 oklch(0.893 0.012 80);
  --input:                  oklch(0.893 0.012 80);
  --ring:                   oklch(0.58 0.14 80);
}
```

- [ ] **Step 4: Trim the `[data-domain]` blocks — remove content-area primary, keep sidebar tokens**

Replace all four `[data-domain]` blocks and their `.dark` overrides with:

```css
/* ── Domain theming — sidebar only ────────────────────────────────────────── */
[data-domain="japanese"] {
  --sidebar-primary: oklch(0.52 0.185 28);
  --sidebar-ring:    oklch(0.52 0.185 28);
}
[data-domain="english"] {
  --sidebar-primary: oklch(0.52 0.190 247);
  --sidebar-ring:    oklch(0.52 0.190 247);
}
[data-domain="french"] {
  --sidebar-primary: oklch(0.48 0.170 275);
  --sidebar-ring:    oklch(0.48 0.170 275);
}
[data-domain="math"] {
  --sidebar-primary: oklch(0.50 0.150 148);
  --sidebar-ring:    oklch(0.50 0.150 148);
}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (no errors).

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "feat: dark-first color tokens, gold accent, trimmed domain blocks"
```

---

## Task 2: globals.css — Heading font + `@layer base` rule

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add `--font-heading` token in `@theme inline`**

Inside the `@theme inline { ... }` block, after the existing `--font-heading` line (currently `'DM Sans'`), replace it:

```css
  --font-heading: 'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif;
```

The existing line reads: `--font-heading: 'DM Sans', system-ui, sans-serif;` — replace the entire value.

- [ ] **Step 2: Add h1/h2/h3 font rule to `@layer base`**

Inside `@layer base { ... }`, add after the existing `html { @apply font-sans; }` line:

```css
  h1, h2, h3 {
    font-family: var(--font-heading);
  }
```

- [ ] **Step 3: Visual check — start dev server and open any page**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`. Expected: page headings render in Noto Serif JP (visibly different — thinner strokes, Japanese-serif character shapes).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: Noto Serif JP heading font, global h1/h2/h3 rule"
```

---

## Task 3: ThemeProvider — dark as default

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Change `defaultTheme` from `"light"` to `"dark"`**

In `app/layout.tsx` line 14, change:

```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
```

to:

```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
```

- [ ] **Step 2: Visual check**

Hard-refresh `http://localhost:3000/dashboard`. Expected: page loads with dark navy background by default (no flash of light mode). The `<html>` element should have class `dark` in DevTools.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: default theme is now dark"
```

---

## Task 4: App layout — increase main padding

**Files:**
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Change main padding from `p-6` to `p-8`**

In `app/(app)/layout.tsx` line 27, change:

```tsx
<main className="flex-1 overflow-y-auto p-6">{children}</main>
```

to:

```tsx
<main className="flex-1 overflow-y-auto p-8">{children}</main>
```

- [ ] **Step 2: Visual check**

Check `http://localhost:3000/dashboard`. Expected: content has slightly more breathing room from the viewport edges (32px padding instead of 24px).

- [ ] **Step 3: Commit**

```bash
git add 'app/(app)/layout.tsx'
git commit -m "feat: increase main content padding p-6 → p-8"
```

---

## Task 5: Button — golden rune treatment

**Files:**
- Modify: `components/ui/button.tsx`

- [ ] **Step 1: Update the `default` variant className**

In `components/ui/button.tsx`, the `buttonVariants` cva call has a `default` variant on line 13. Replace:

```ts
default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
```

with:

```ts
default: "bg-[oklch(0.22_0.06_80)] border border-primary text-primary-foreground tracking-wide font-bold hover:bg-[oklch(0.26_0.07_80)]",
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: no output.

- [ ] **Step 3: Visual check**

Open `http://localhost:3000/admin` or any page with a primary button. Expected: button has dark amber background with a visible gold border and slightly wider letter spacing. Hover lightens the amber background slightly.

- [ ] **Step 4: Commit**

```bash
git add components/ui/button.tsx
git commit -m "feat: golden rune button — dark amber bg, gold border, wide tracking"
```

---

## Task 6: LessonCard — accent stripe + spacing + heading font

**Files:**
- Modify: `components/lesson-card.tsx`

- [ ] **Step 1: Update the Card and CardContent classNames**

Replace the entire contents of `components/lesson-card.tsx` with:

```tsx
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LessonCardProps {
  id: number; level: string; topic: string; chapter: number
  status?: 'in_progress' | 'completed' | null
}

export function LessonCard({ id, level, topic, chapter, status }: LessonCardProps) {
  return (
    <Link href={`/lessons/${id}`}>
      <Card className="hover:bg-muted/50 cursor-pointer transition-colors border-l-4 border-primary">
        <CardContent className="py-5 flex items-center justify-between">
          <div>
            <p className="font-medium font-heading">{topic}</p>
            <p className="text-xs text-muted-foreground">Chapter {chapter}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="uppercase text-xs">{level}</Badge>
            {status === 'completed'   && <Badge className="text-xs">✓</Badge>}
            {status === 'in_progress' && <Badge variant="secondary" className="text-xs">In progress</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: no output.

- [ ] **Step 3: Visual check**

Open `http://localhost:3000/lessons`. Expected: each lesson card has a gold left border stripe, more vertical padding, and topic text in Noto Serif JP.

- [ ] **Step 4: Commit**

```bash
git add components/lesson-card.tsx
git commit -m "feat: lesson card — gold left stripe, py-5, Noto Serif JP topic"
```

---

## Task 7: Sidebar — active nav left accent border

**Files:**
- Modify: `components/sidebar.tsx`

- [ ] **Step 1: Update active/inactive nav item classes**

In `components/sidebar.tsx`, find the nav item span className (around line 120–124). Replace the active/inactive class logic:

```tsx
// Current:
active
  ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'

// New:
active
  ? 'bg-sidebar-accent text-sidebar-foreground font-medium border-l-2 border-white/70 pl-[10px]'
  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground pl-3'
```

The full span className becomes:

```tsx
<span className={`flex items-center gap-2.5 h-9 px-3 rounded-md text-sm transition-colors cursor-pointer ${
  active
    ? 'bg-sidebar-accent text-sidebar-foreground font-medium border-l-2 border-white/70 pl-[10px]'
    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground pl-3'
}`}>
```

- [ ] **Step 2: Visual check**

Open any page. Expected: the active sidebar nav item has a subtle white left border accent. Navigating to a different page moves the accent to the new active item.

- [ ] **Step 3: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat: sidebar active nav item gets gold-white left border accent"
```

---

## Task 8: Dashboard — spacing, stat cards, heading

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Replace the full page content**

Replace the entire contents of `app/(app)/dashboard/page.tsx` with:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useApp } from '@/app/context'
import { DOMAINS } from '@/lib/domains'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Stats {
  total_students: number
  total_lessons:  number
  total_progress: number
  avg_score:      number | null
}

interface Lesson {
  id: number; level: string; topic: string; chapter: number; domain: string
}

export default function DashboardPage() {
  const { currentStudent, domain } = useApp()
  const [stats,  setStats]  = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Lesson[]>([])

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats)
    fetch(`/api/lessons?domain=${domain}`)
      .then(r => r.json())
      .then((rows: Lesson[]) => setRecent(rows.slice(-3).reverse()))
  }, [domain])

  const tutor = DOMAINS[domain]

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h1 className="text-3xl font-heading font-semibold leading-tight">
          {domain === 'japanese' ? 'いらっしゃいませ' : 'Welcome back'}
          {currentStudent ? `, ${currentStudent.name}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Your {tutor.name} tutor is <strong>{tutor.tutor}</strong>
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Students',  value: stats.total_students },
            { label: 'Lessons',   value: stats.total_lessons },
            { label: 'Completed', value: stats.total_progress },
            { label: 'Avg score', value: stats.avg_score != null ? `${stats.avg_score}%` : '—' },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold font-sans">{value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Recent lessons</h2>
        {recent.length === 0
          ? <p className="text-muted-foreground text-sm">No lessons yet. Generate one in Admin.</p>
          : <div className="flex flex-col gap-3">
              {recent.map(l => (
                <Link key={l.id} href={`/lessons/${l.id}`}>
                  <Card className="hover:bg-muted/50 cursor-pointer transition-colors border-l-4 border-primary">
                    <CardContent className="py-5 flex items-center justify-between">
                      <span className="font-heading font-medium">{l.topic}</span>
                      <span className="text-xs text-muted-foreground uppercase">{l.level}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
        }
        <Link href="/lessons">
          <Button variant="outline" className="mt-4">All lessons →</Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: no output.

- [ ] **Step 3: Visual check**

Open `http://localhost:3000/dashboard`. Expected:
- Heading in Noto Serif JP, larger
- Stat cards with large `text-4xl` numbers and small uppercase labels
- `gap-6` between stat cards (more breathing room)
- Recent lesson cards with gold left stripe, matching the lessons page

- [ ] **Step 4: Commit**

```bash
git add 'app/(app)/dashboard/page.tsx'
git commit -m "feat: dashboard — large stat numbers, Noto Serif heading, space-y-10"
```

---

## Task 9: Remaining page h1s — lessons, chat, progress

**Files:**
- Modify: `app/(app)/lessons/page.tsx`
- Modify: `app/(app)/chat/page.tsx`
- Modify: `app/(app)/progress/page.tsx`

- [ ] **Step 1: Update lessons page h1 and outer spacing**

In `app/(app)/lessons/page.tsx`, make two changes:

1. Change the outer div className: `"max-w-3xl space-y-4"` → `"max-w-3xl space-y-10"`
2. Change the h1: `"text-2xl font-bold"` → `"text-3xl font-heading font-semibold leading-tight"`

```tsx
// Outer div:
<div className="max-w-3xl space-y-10">

// h1:
<h1 className="text-3xl font-heading font-semibold leading-tight">{t.lessonsHeading}</h1>
```

- [ ] **Step 2: Update chat page h1**

In `app/(app)/chat/page.tsx`, change:

```tsx
// Current:
<h1 className="text-xl font-bold">Ask Sensei</h1>

// New:
<h1 className="text-3xl font-heading font-semibold leading-tight">Ask Sensei</h1>
```

- [ ] **Step 3: Update progress page h1 and outer spacing**

In `app/(app)/progress/page.tsx`, make two changes:

1. Change outer div: `"max-w-3xl space-y-4"` → `"max-w-3xl space-y-10"`
2. Change h1: `"text-2xl font-bold"` → `"text-3xl font-heading font-semibold leading-tight"`

```tsx
// Outer div:
<div className="max-w-3xl space-y-10">

// h1:
<h1 className="text-3xl font-heading font-semibold leading-tight">Progress — {currentStudent.name}</h1>
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: no output.

- [ ] **Step 5: Visual check — navigate all pages**

Check `/lessons`, `/chat`, `/progress`. Expected: all page titles render in Noto Serif JP at `text-3xl`. Vertical spacing between sections is noticeably more generous.

- [ ] **Step 6: Commit**

```bash
git add 'app/(app)/lessons/page.tsx' 'app/(app)/chat/page.tsx' 'app/(app)/progress/page.tsx'
git commit -m "feat: Noto Serif JP h1 + space-y-10 on lessons, chat, progress pages"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Dark-first `:root` palette | Task 1 Step 1 |
| `.dark` mirrors `:root` for next-themes | Task 1 Step 2 |
| `.light` opt-in overrides | Task 1 Step 3 |
| Domain blocks trimmed to sidebar-only | Task 1 Step 4 |
| `--font-heading` = Noto Serif JP | Task 2 Step 1 |
| `h1, h2, h3` use `--font-heading` globally | Task 2 Step 2 |
| `defaultTheme="dark"` | Task 3 |
| `p-6` → `p-8` on main | Task 4 |
| Button: dark amber bg + gold border + `tracking-wide` | Task 5 |
| LessonCard: `border-l-4 border-primary`, `py-5`, `font-heading` | Task 6 |
| Sidebar active nav `border-l-2 border-white/70` | Task 7 |
| Dashboard: `space-y-10`, `gap-6`, `text-4xl font-sans` stats, `tracking-widest` labels | Task 8 |
| Lessons / Chat / Progress h1 → `text-3xl font-heading font-semibold` | Task 9 |
| `--radius: 0.375rem` | Task 1 Step 1 ✓ (included in `:root` block) |
