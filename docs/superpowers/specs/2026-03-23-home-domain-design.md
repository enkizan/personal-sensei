# Home Domain Feature — Design Spec

**Date:** 2026-03-23
**Status:** Approved

## Summary

Add a Home icon to the sidebar domain badge. Clicking it marks the currently active domain as the student's home (default) domain. On login the home domain loads first; the domain picker dropdown lists the home domain at the top.

## Data Layer

- Add `home_domain text DEFAULT 'japanese'` column to the `students` table via Drizzle schema.
- Run `drizzle-kit push` to apply the migration.
- Extend the PATCH `/api/students/[id]` field allowlist to include `home_domain`.

## Context (`app/context.tsx`)

- Add `homeDomain: Domain` state, initialised from `initialStudent.home_domain ?? 'japanese'`.
- Add `setHomeDomain(d: Domain): Promise<void>` — updates local state and PATCHes the student record.
- In `setStudent`: initialise the active domain from `home_domain` (not `domain`) so login always lands on the home domain.

## Sidebar (`components/sidebar.tsx`)

- Import `Home` from lucide-react.
- Render `<Home>` inline after the domain name text in the brand block.
- Icon is **primary colour** when `domain === homeDomain`; **muted** when not.
- Clicking calls `setHomeDomain(domain)`.

## DomainPicker (`components/domain-picker.tsx`)

- Sort the domain list: `homeDomain` first, then remaining keys in original DOMAINS order.
- Replace the `✓` checkmark on the home domain row with a filled Home icon badge.

## Constraints

- No new table — `home_domain` lives on `students`.
- `switchDomain` continues to update `students.domain` (last active) independently of `home_domain`.
- Feature degrades gracefully when no student is selected (Home icon is hidden or disabled).
