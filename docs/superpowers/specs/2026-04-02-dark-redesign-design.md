# Dark Redesign — Design Spec

**Date:** 2026-04-02
**Reference:** `docs/bootdev-design-analysis.md`
**Approach:** Option B — Token redesign + targeted component polish
**Scope:** Everything — `globals.css`, sidebar, buttons, cards, page headings, dashboard, layout

---

## Goals

Apply Boot.dev's design principles to the Japanese learning platform:
- Dark-first palette (dark = default `:root`, light = `.light` opt-in)
- Gold accent replaces domain rust/blue/etc as the universal interactive color
- Domain color survives only on the sidebar kanji badge (`--sidebar-primary`)
- Noto Serif JP becomes the heading font across all pages
- Tighter radius, wider button tracking, more vertical breathing room

---

## 1. Color Tokens (`globals.css`)

### `:root` — Dark (new default)

| Token | OKLCH | Purpose |
|-------|-------|---------|
| `--background` | `oklch(0.18 0.02 264)` | Page base — deep navy-grey |
| `--foreground` | `oklch(0.93 0.01 240)` | Primary text — near-white, cool tint |
| `--card` | `oklch(0.22 0.02 264)` | Elevated surface — slightly lighter than bg |
| `--card-foreground` | `oklch(0.93 0.01 240)` | Text on cards |
| `--popover` | `oklch(0.22 0.02 264)` | Same as card |
| `--popover-foreground` | `oklch(0.93 0.01 240)` | |
| `--primary` | `oklch(0.72 0.14 80)` | Gold accent — all interactive elements |
| `--primary-foreground` | `oklch(0.15 0.03 80)` | Dark amber text on gold |
| `--secondary` | `oklch(0.25 0.02 264)` | Hover/secondary surfaces |
| `--secondary-foreground` | `oklch(0.93 0.01 240)` | |
| `--muted` | `oklch(0.25 0.02 264)` | Muted surface |
| `--muted-foreground` | `oklch(0.65 0.02 240)` | Secondary text |
| `--accent` | `oklch(0.25 0.02 264)` | Same as muted |
| `--accent-foreground` | `oklch(0.93 0.01 240)` | |
| `--border` | `oklch(0.30 0.02 264)` | Subtle border |
| `--input` | `oklch(0.30 0.02 264)` | Input borders |
| `--ring` | `oklch(0.72 0.14 80)` | Focus ring — gold |
| `--radius` | `0.375rem` | 6px — tighter, more structured |

### `.light` — Light (opt-in, applied via toggle)

| Token | OKLCH | Purpose |
|-------|-------|---------|
| `--background` | `oklch(0.972 0.007 75)` | Warm cream (unchanged from original) |
| `--foreground` | `oklch(0.149 0 0)` | Near-black |
| `--card` | `oklch(1 0 0)` | Pure white card |
| `--card-foreground` | `oklch(0.149 0 0)` | |
| `--primary` | `oklch(0.58 0.14 80)` | Gold (darker for light bg readability) |
| `--primary-foreground` | `oklch(0.985 0 0)` | White text on gold |
| `--secondary` | `oklch(0.945 0.010 80)` | Warm tan |
| `--secondary-foreground` | `oklch(0.149 0 0)` | |
| `--muted` | `oklch(0.913 0.012 80)` | Slightly darker tan |
| `--muted-foreground` | `oklch(0.530 0 0)` | Medium grey |
| `--border` | `oklch(0.893 0.012 80)` | Warm border |
| `--input` | `oklch(0.893 0.012 80)` | |
| `--ring` | `oklch(0.58 0.14 80)` | Gold ring |
| `--radius` | `0.375rem` | Same tight radius |

### Sidebar tokens (unchanged — always dark navy)

`--sidebar`, `--sidebar-foreground`, etc. remain identical in both modes. Domain `--sidebar-primary` stays per-domain (the only place domain color survives).

### Domain theming (content area — all now point to gold)

The `[data-domain="X"]` blocks in the content area are **removed**. Domain color is no longer overridden in the content area. `--primary` stays gold everywhere. Only `[data-domain="X"]` on sidebar-scoped tokens remains:

The `[data-domain="X"]` blocks are **trimmed, not deleted**. Remove `--primary` and `--ring` lines from each block. Keep `--sidebar-primary` and `--sidebar-ring` lines so the kanji badge and sidebar active indicator stay domain-colored.

```css
/* Before (example): */
[data-domain="japanese"] {
  --primary: oklch(0.52 0.185 28);
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.52 0.185 28);
}

/* After: */
[data-domain="japanese"] {
  --sidebar-primary: oklch(0.52 0.185 28);
  --sidebar-ring:    oklch(0.52 0.185 28);
}
/* Repeat for english, french, math with their respective hues */
```

---

## 2. Typography (`globals.css` + `@layer base`)

### Font token change

```css
--font-heading: 'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif;
/* --font-sans and --font-mono unchanged */
```

### Global heading rule

```css
@layer base {
  h1, h2, h3 {
    font-family: var(--font-heading);
  }
}
```

### Type scale (Tailwind utilities applied at usage sites)

| Element | Classes | Notes |
|---------|---------|-------|
| Page `h1` | `text-3xl font-semibold leading-tight` | Dashboard, Lessons, Chat, Progress |
| Section `h2` | `text-2xl font-semibold leading-snug` | Card titles, lesson topics |
| Stat number | `text-4xl font-bold font-sans` | Dashboard cards — DM Sans for numerals |
| Button text | `font-bold tracking-wide` | `letter-spacing: 0.08em` via Tailwind |
| Body/labels | unchanged | DM Sans 400–500 |

`font-sans` is explicitly set on stat numbers to keep DM Sans (not Noto Serif JP) for large numerals — Japanese serif digits are less legible at display size.

---

## 3. Spacing & Layout Rhythm

### `(app)/layout.tsx`

```tsx
/* Change main padding: p-6 → p-8 */
<main className="flex-1 overflow-y-auto p-8">{children}</main>
```

### Page section rhythm

| Current | New | Applied on |
|---------|-----|------------|
| `space-y-6` | `space-y-10` | Top-level page `<div>` wrapper |
| `mb-3` (section sub-heading margin) | `mb-4` | h2 before card lists |
| `gap-4` (stat grid) | `gap-6` | Dashboard stats grid |
| `mb-2` (lesson card gap) | flex `gap-3` | Lesson card list |
| Card `py-3`/`py-4` | `py-5` | LessonCard, dashboard recent cards |

### Border radius

`--radius: 0.375rem` (6px) ripples through the radius scale:
- `--radius-sm`: 3.6px (~4px)
- `--radius-md`: 4.8px (~5px)
- `--radius-lg`: 6px
- `--radius-xl`: 9.6px (~10px)

---

## 4. Component Changes

### Button (primary variant) — `globals.css` `@layer components` OR shadcn button override

Primary buttons get the "golden rune" treatment:

```css
/* In @layer components */
.btn-primary-dark {
  background-color: oklch(0.22 0.06 80);   /* dark amber behind gold */
  border: 1.5px solid oklch(0.72 0.14 80); /* gold border */
  border-radius: var(--radius-sm);
  letter-spacing: 0.08em;
  font-weight: 700;
}
```

This is applied by updating the `default` variant's `className` string directly in `components/ui/button.tsx` — replace the existing `bg-primary text-primary-foreground` classes with `bg-[oklch(0.22_0.06_80)] border border-[oklch(0.72_0.14_80)] text-primary-foreground tracking-wide`. No new CSS class needed.

### LessonCard — `components/lesson-card.tsx`

```tsx
/* Changes:
   - Add border-l-4 border-primary (gold left accent stripe)
   - Increase padding: py-4 → py-5
   - Topic in font-heading (Noto Serif JP)
   - Card bg picks up new --card token automatically
*/
<Card className="hover:bg-muted/50 cursor-pointer transition-colors border-l-4 border-primary">
  <CardContent className="py-5 flex items-center justify-between">
    <div>
      <p className="font-medium font-heading">{topic}</p>
      <p className="text-xs text-muted-foreground">Chapter {chapter}</p>
    </div>
    ...
  </CardContent>
</Card>
```

### Dashboard stat cards — `app/(app)/dashboard/page.tsx`

```tsx
/* Stat number: text-2xl → text-4xl font-bold font-sans
   Label: add uppercase tracking-widest text-xs
*/
<CardHeader className="pb-1">
  <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
</CardHeader>
<CardContent>
  <span className="text-4xl font-bold font-sans">{value}</span>
</CardContent>
```

### Page h1 headings — dashboard, lessons, chat, progress pages

```tsx
/* Current: className="text-2xl font-bold" */
/* New:     className="text-3xl font-heading font-semibold" */
```

Applied to the `<h1>` in each of: `dashboard/page.tsx`, `lessons/page.tsx`, `chat/page.tsx`, `progress/page.tsx`.

### Sidebar nav active state — `components/sidebar.tsx`

```tsx
/* Add left accent border on active nav item */
active
  ? 'bg-sidebar-accent text-sidebar-foreground font-medium border-l-2 border-white/70 pl-[10px]'
  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground pl-3'
```

### Dark mode class strategy

The `next-themes` provider currently uses `class` strategy with `dark`. We switch to:
- Default (no class): dark styles (`:root` is dark)
- `.light` class: light override

In `app/layout.tsx`, update `ThemeProvider`:
```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
```

The sidebar's theme toggle label flips: button shows "Light mode" by default (since dark is default).

---

## 5. Files Changed

| File | Change |
|------|--------|
| `app/globals.css` | Full token rewrite, heading font, button component style, remove content-area domain overrides |
| `app/layout.tsx` | ThemeProvider `defaultTheme="dark"` |
| `app/(app)/layout.tsx` | `p-6` → `p-8` on `<main>` |
| `components/sidebar.tsx` | Active nav border-l accent; theme toggle default label |
| `components/lesson-card.tsx` | Border-l-4 accent, py-5, font-heading topic |
| `components/ui/button.tsx` | Default variant gets dark-amber bg + gold border + tracking |
| `app/(app)/dashboard/page.tsx` | Stat numbers text-4xl, label tracking-widest, space-y-10, gap-6 |
| `app/(app)/lessons/page.tsx` | h1 font-heading, space-y-10 |
| `app/(app)/chat/page.tsx` | h1 font-heading |
| `app/(app)/progress/page.tsx` | h1 font-heading |

---

## Out of Scope

- Center-aligning section headings (Option C — separate pass)
- Alternating section background tints
- Rebuilding lesson list as a grid
- Redesigning the quiz engine UI
- Admin page restyling
