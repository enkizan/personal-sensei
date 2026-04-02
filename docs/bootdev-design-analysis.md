# Boot.dev — Design & Layout Analysis

> **Source:** https://www.boot.dev (public homepage, dashboard redirects to login)
> **Measured at:** 1200px viewport width
> **Extracted via:** Playwright computed styles + visual inspection

---

## 1. Design Philosophy

Boot.dev builds a **fantasy RPG aesthetic around learning to code**. Every design decision reinforces the metaphor that studying is an adventure: you level up, defeat challenges, and earn rewards. This is not accidental polish — it's a deeply coherent brand choice executed with discipline.

Five principles govern everything:

1. **Gamified identity** — Fantasy typefaces, gold borders, dungeon-dark backgrounds. Learning feels like World of Warcraft, not a SaaS dashboard.
2. **Dark-first, two-shade depth** — Two nearly-identical dark blues create subtle Z-axis depth without harsh contrast.
3. **Gold as the only warm accent** — One warm color (gold) is used exclusively for interactive/CTA elements. It is never diluted.
4. **Center-aligned editorial layout** — Every section heading, subheading, and CTA is centered. The page reads like a monumental editorial poster, not an app.
5. **Angular corners + wide letter-spacing** — `border-radius: 2px` and `letter-spacing: 1.6px` on buttons signal "engraved" and "serious". Deliberately avoids the soft pill shapes of modern SaaS.

---

## 2. Color Palette

All values are exact computed CSS colors from the live page.

### Backgrounds

| Role | RGB | Hex approx | Usage |
|------|-----|------------|-------|
| Page base | `rgb(37, 41, 54)` | `#25293` | `<body>` background — entire page |
| Elevated surface | `rgb(32, 35, 48)` | `#202330` | Alternate section tint, cards |
| CTA button fill | `rgb(42, 28, 12)` | `#2A1C0C` | Dark amber — behind gold border |

### Accents

| Role | RGB | Hex approx | Usage |
|------|-----|------------|-------|
| Gold accent | `rgb(214, 158, 2)` | `#D69E02` | CTA borders, highlights, decorative dividers |
| Gold border on button | `rgb(193, 133, 0)` | `#C18500` | Button `border-color` (slightly darker than above) |
| Divider / subtle border | `rgb(50, 56, 69)` | `#323845` | Section separators, FAQ lines |
| Blue-grey border | `rgb(135, 148, 192)` | `#8794C0` | Some secondary UI elements |

### Text Hierarchy

Six text colors form a structured opacity scale. All are cool-tinted whites/greys — no warm text.

| Level | RGB | Usage |
|-------|-----|-------|
| Bright white | `rgb(255, 255, 255)` | H1 hero, key stats |
| Near-white | `rgb(232, 236, 241)` | H2 section headings |
| Primary body | `rgb(215, 222, 230)` | Most body text |
| Secondary body | `rgb(178, 193, 208)` | Supporting copy |
| Muted | `rgb(163, 179, 199)` | Labels, captions |
| Dimmest | `rgb(145, 157, 171)` | Tertiary metadata |

---

## 3. Typography

### Font Families

| Font | Classification | Role |
|------|---------------|------|
| **Arcuata** | Custom fantasy serif | All section headings (H1, H2), brand wordmark |
| **ArcuataExtBd / ArcuataMed / ArcuataLight** | Arcuata variants | Weight variants for decorative use |
| **DMSans** | Geometric sans-serif | All body text, subheadings, UI labels |
| **trajan-pro-3** | Classical Roman serif | Logo/ornamental (Adobe Fonts) |

The pairing is deliberate: **Arcuata** (mythic, heavy) for grandeur; **DMSans** (neutral, readable) for information. They never mix in the same text block.

### Type Scale

| Element | Font | Size | Weight | Line-height | Letter-spacing | Align |
|---------|------|------|--------|-------------|----------------|-------|
| H1 (hero) | Arcuata | 48px | 800 | 48px (1:1) | normal | center |
| H2 (section) | Arcuata | 36px | 800 | ~44px | normal | center |
| H2 (hero sub) | DMSans | 20px | 500 | 28px | normal | center |
| H3 (section sub) | DMSans | 20px | 500 | 28px | normal | center |
| Body / p | DMSans | 16px | 400 | 24px (1.5) | normal | — |
| CTA button | DMSans | 16px | 700 | — | **1.6px** | — |
| "There's no risk" sub-H2 | Arcuata | 24px | 800 | — | normal | center |

**Key observation — H1 tight line-height:** The hero H1 uses `line-height: 48px` on `font-size: 48px` — a 1:1 ratio. This is intentionally compressed for a display/poster effect; it would be too tight for multi-line body text.

**Key observation — button letter-spacing:** `letter-spacing: 1.6px` on 16px text is 0.1em — equivalent to small-caps tracking. Combined with `font-weight: 700`, the button text feels stamped or engraved rather than typed.

---

## 4. Layout & Grid

### Page Container

```
max-width:  1024px (main content)
            896px  (some sub-sections)
margin:     0 88px  (at 1200px viewport — effectively centers with generous breathing room)
padding-x:  16px   (inner padding on the container itself)
```

The 88px side margin at 1200px viewport means ~176px total horizontal margin — about 14.7% of the viewport each side. This produces a focused, narrow column that forces reading speed.

### Section Vertical Rhythm

Every content section uses an **identical** vertical padding rule:

```
padding-top:    96px
padding-bottom: 112px
```

The 16px asymmetry (more bottom) creates downward visual momentum — your eye is pulled to the next section. This is a subtle but intentional rhythm borrowed from editorial print design.

### Grid System

Three-column grids dominate. All grids use consistent `gap: 32px`.

```
Feature grid:   3 columns × ~269px  gap: 32px   (testimonials, course cards)
Community grid: 3 columns × ~288px  gap: 16px   (tighter, badge-style)
Stats grid:     3 columns × ~277px  gap: 32px   (instructor cards)
```

No 4-column or 2-column grids appear. The 3-column rule maintains visual balance at the 1024px max-width.

### Flex Spacing Scale

Bootstrap-style spacing scale with these gaps in use:

```
8px   — tight inline elements (icon + label)
10px  — centered flex rows
12px  — compact list items
16px  — standard card internal spacing
24px  — medium component spacing
32px  — section-level spacing between cards
```

---

## 5. Component Patterns

### CTA Button

The primary CTA is a distinctive "golden rune" button:

```css
background:     rgb(42, 28, 12)   /* dark amber — not black */
border:         2px solid rgb(193, 133, 0)  /* gold */
border-radius:  2px               /* nearly square — angular, not rounded */
padding:        12px 36px         /* tall and wide — monumental proportions */
font-size:      16px
font-weight:    700
letter-spacing: 1.6px             /* wide tracking — engraved feel */
```

The dark amber background is important: pure black behind gold looks cheap. The warm dark brown makes the gold glow. This is the same trick used in metalwork and book illumination.

### Navigation

- Transparent background (no solid nav bar)
- Minimal: only 2 left links ("For Business", "For Schools") + 1 right CTA
- No hamburger or mega-menu — assumes a focused, single-purpose marketing page
- Height ~216px (tall, includes logo hero section below it)

### Section Structure Pattern

Every section follows the same two-block pattern:

```
┌─────────────────────────────────────┐
│  [centered heading — Arcuata 36px]  │
│  [centered subtext — DMSans 20px]   │
│         (max-width ~896px)          │
├─────────────────────────────────────┤
│  [3-column grid OR feature visual]  │
│         (max-width 1024px)          │
└─────────────────────────────────────┘
```

This heading + content split is applied to every single section without exception. The predictability lets users scan quickly — they always know where to look for the "what is this section about" answer.

### FAQ Accordion

- Plain horizontal `<hr>` separators (color `rgb(50, 56, 69)`)
- No card backgrounds — separators alone define the list structure
- Minimal decoration — confidence that content quality carries the section

---

## 6. Visual Hierarchy Summary

Reading the page top-to-bottom, priority is established through:

1. **Size** — 48px Arcuata hero vs 16px body (3:1 ratio)
2. **Font switch** — Arcuata = "this matters"; DMSans = "here are the details"
3. **Color brightness** — pure white for the one thing to read first; dimmer greys for supporting info
4. **Gold** — only appears on actionable elements; trains the eye to find calls-to-action instantly
5. **Spacing** — 96px gaps between sections signal "chapter break"; 32px between cards signal "related items"

---

## 7. Takeaways for This Project

Patterns worth borrowing for the Japanese learning platform:

| Boot.dev pattern | Adaptation |
|-----------------|------------|
| Two-level dark bg (`#25293` / `#202330`) | Use OKLCH equivalents for section alternation |
| Single accent color (gold) never diluted | Domain primary color used only for interactive elements |
| Arcuata for headings, DMSans for body | Noto Serif JP for Japanese headings; DM Sans already in use ✓ |
| `padding: 96px 0 112px` section rhythm | Increase current section padding from `p-6` to `py-16/py-24` |
| 3-column grids at `gap: 32px` | Lesson card grids could move from `gap: 16px` → `gap: 32px` for breathing room |
| `letter-spacing: 1.6px` wide CTA buttons | Apply to primary action buttons across the platform |
| Center-aligned section headings | Lesson page section titles currently left-aligned — centering adds gravitas |
