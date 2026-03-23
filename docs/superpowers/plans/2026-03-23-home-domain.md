# Home Domain Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Home icon to the sidebar that lets a student pin any domain as their default; on login the home domain loads first and sorts to the top of the domain picker dropdown.

**Architecture:** Add `home_domain` column to the `students` table (server-persisted per student). The app context tracks `homeDomain` state separately from the active `domain`. The sidebar Home icon writes it; the domain picker reads it for sorting.

**Tech Stack:** Next.js 16, React 19, TypeScript, Drizzle ORM, Neon PostgreSQL, Tailwind CSS v4, lucide-react

---

## File Map

| File | Change |
|---|---|
| `lib/db/schema.ts` | Add `home_domain` column |
| `app/api/students/[id]/route.ts` | Allowlist `home_domain` in PATCH |
| `app/context.tsx` | Add `homeDomain` state + `setHomeDomain`; init domain from `home_domain` on login |
| `app/(app)/layout.tsx` | Use `home_domain` for SSR initial domain |
| `components/sidebar.tsx` | Add Home icon next to domain name |
| `components/domain-picker.tsx` | Sort home domain first; badge on home domain row |

---

### Task 1: Add `home_domain` column to schema

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add the column**

In `lib/db/schema.ts`, add `home_domain` to the students table after the `domain` line:

```ts
domain:          text('domain').default('japanese'),
home_domain:     text('home_domain').default('japanese'),
```

- [ ] **Step 2: Push migration**

```bash
npx drizzle-kit push
```

Expected: Drizzle detects one new column and applies the migration with no data loss.

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add home_domain column to students"
```

---

### Task 2: Allow `home_domain` in the PATCH API

**Files:**
- Modify: `app/api/students/[id]/route.ts`

- [ ] **Step 1: Extend the allowlist**

In the `PATCH` handler, destructure `home_domain` from body and add it to the patch object:

```ts
const { name, email, native_language, domain, home_domain } = body
// ...existing patch lines...
if (home_domain !== undefined) patch.home_domain = home_domain
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/api/students/[id]/route.ts
git commit -m "feat: allow patching home_domain on student"
```

---

### Task 3: Add `homeDomain` to context

**Files:**
- Modify: `app/context.tsx`

- [ ] **Step 1: Extend AppState interface**

Add two new members:

```ts
homeDomain:    Domain
setHomeDomain: (d: Domain) => Promise<void>
```

- [ ] **Step 2: Add state and handler**

Inside `AppProvider`, after the existing `domain` state:

```ts
const [homeDomain, setHomeDomainState] = useState<Domain>(
  (initialStudent?.home_domain as Domain) ?? 'japanese'
)

const setHomeDomain = useCallback(async (d: Domain) => {
  setHomeDomainState(d)
  if (currentStudent) {
    await fetch(`/api/students/${currentStudent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_domain: d }),
    })
  }
}, [currentStudent])
```

- [ ] **Step 3: Fix login — init active domain from `home_domain`**

In `setStudent`, change the domain init line from `s.domain` to `s.home_domain`:

```ts
setDomain((s.home_domain as Domain) ?? s.domain as Domain ?? 'japanese')
setHomeDomainState((s.home_domain as Domain) ?? 'japanese')
```

- [ ] **Step 4: Expose in context value**

Add `homeDomain` and `setHomeDomain` to the `AppContext.Provider` value object:

```ts
<AppContext.Provider value={{
  currentStudent, domain, mathLevelMode, homeDomain,
  setStudent, switchDomain, setMathLevelMode, setHomeDomain,
}}>
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/context.tsx
git commit -m "feat: add homeDomain state and setHomeDomain to context"
```

---

### Task 4: Use `home_domain` for SSR initial domain in layout

**Files:**
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Change `initialDomain` to use `home_domain`**

Replace:

```ts
const initialDomain = (initialStudent?.domain ?? 'japanese') as string
```

With:

```ts
const initialDomain = (initialStudent?.home_domain ?? initialStudent?.domain ?? 'japanese') as string
```

This ensures the `data-domain` attribute (which drives CSS theming) matches the home domain on first server render, preventing a flash.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/(app)/layout.tsx
git commit -m "fix: use home_domain for SSR initial domain theme"
```

---

### Task 5: Add Home icon to sidebar

**Files:**
- Modify: `components/sidebar.tsx`

- [ ] **Step 1: Import `Home` icon and `homeDomain`/`setHomeDomain` from context**

Add `Home` to the lucide-react import:

```ts
import { Sun, Moon, LayoutDashboard, BookOpen, MessageCircle, BarChart2, Settings, Home } from 'lucide-react'
```

Add `homeDomain` and `setHomeDomain` to the `useApp()` destructure:

```ts
const { currentStudent, domain, homeDomain, setHomeDomain, switchDomain } = useApp()
```

(Remove unused `switchDomain` only if it was never used here — it wasn't, so remove it.)

- [ ] **Step 2: Render the Home icon**

In the brand block, after the domain name `<div>`, add the icon button. The full brand block becomes:

```tsx
<div className="flex items-center gap-2.5 mb-3">
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-base font-bold font-jp">
    {BRAND_KANJI[domain] ?? DOMAINS[domain].icon}
  </span>
  <div className="flex-1 min-w-0">
    <div className="text-sm font-semibold leading-none text-sidebar-foreground">
      {DOMAINS[domain].name}
    </div>
    <div className="text-xs text-sidebar-foreground/60 mt-0.5">Learning</div>
  </div>
  {currentStudent && (
    <button
      onClick={() => setHomeDomain(domain)}
      title={domain === homeDomain ? 'Home domain' : 'Set as home domain'}
      className="shrink-0 transition-colors"
    >
      <Home
        className={`h-4 w-4 ${
          domain === homeDomain
            ? 'text-primary fill-primary'
            : 'text-sidebar-foreground/30 hover:text-sidebar-foreground/70'
        }`}
      />
    </button>
  )}
</div>
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat: add Home icon to sidebar domain badge"
```

---

### Task 6: Sort home domain first in DomainPicker

**Files:**
- Modify: `components/domain-picker.tsx`

- [ ] **Step 1: Import `Home` and pull `homeDomain` from context**

Add to lucide-react import: `Home`

Add to `useApp()` destructure: `homeDomain`

- [ ] **Step 2: Sort domain keys — home domain first**

Replace the `Object.keys(DOMAINS)` call with a sorted list:

```ts
const domainKeys = [
  homeDomain,
  ...(Object.keys(DOMAINS) as Domain[]).filter(k => k !== homeDomain),
]
```

Use `domainKeys` in the map instead of `Object.keys(DOMAINS)`.

- [ ] **Step 3: Badge the home domain row**

In the row, replace the `✓` mark with a Home icon for the home domain, and keep `✓` for the currently active domain if it differs:

```tsx
<button
  key={key}
  className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
  onClick={() => { switchDomain(key); setOpen(false) }}
>
  <span className="text-base font-bold w-6 text-center">{DOMAINS[key].icon}</span>
  <span className="flex-1 text-left">{DOMAINS[key].name}</span>
  {key === homeDomain
    ? <Home className="h-3.5 w-3.5 text-primary fill-primary" />
    : key === domain && <span className="text-primary text-xs">✓</span>
  }
</button>
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add components/domain-picker.tsx
git commit -m "feat: sort home domain first in DomainPicker, badge with Home icon"
```

---

### Task 7: Smoke test end-to-end

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify these behaviours manually**

1. Select a student → active domain loads from their `home_domain` (check DB if needed: `SELECT name, domain, home_domain FROM students;`)
2. Switch to a non-home domain → Home icon becomes dimmed
3. Click Home icon → icon fills with primary colour, domain picker now lists that domain first
4. Refresh page → domain still loads the home domain (SSR)
5. Switch student → their home domain loads

- [ ] **Step 3: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "fix: home domain smoke test fixups"
```
