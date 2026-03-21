/**
 * One-time migration: SQLite (japanese.db) → local/Neon Postgres
 *
 * Run: npx dotenv-cli -e .env.local -- npx tsx scripts/migrate-sqlite.ts
 *
 * Requires better-sqlite3 (already in devDependencies).
 * Run locally only — never in CI or Vercel build.
 */

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { students, lessons, progress } from '../lib/db/schema'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

const sqlite = new Database(
  '/Users/tungsanlee/Documents/Japanese-study/japanese-platform/japanese.db'
)

// Students
const existingStudents = sqlite.prepare('SELECT * FROM students').all() as any[]
if (existingStudents.length > 0) {
  await db.insert(students).values(
    existingStudents.map(s => ({
      id:              s.id,
      name:            s.name,
      email:           s.email ?? null,
      native_language: s.native_language ?? 'zh',
      domain:          s.domain ?? 'japanese',
      created_at:      s.created_at ? new Date(s.created_at) : new Date(),
    }))
  ).onConflictDoNothing()
  console.log(`✓ Migrated ${existingStudents.length} students`)
}

// Lessons
const existingLessons = sqlite.prepare('SELECT * FROM lessons').all() as any[]
if (existingLessons.length > 0) {
  await db.insert(lessons).values(
    existingLessons.map(l => ({
      id:         l.id,
      level:      l.level,
      chapter:    l.chapter,
      topic:      l.topic,
      content:    JSON.parse(l.content),   // TEXT → JSONB
      domain:     l.domain ?? 'japanese',
      created_at: l.created_at ? new Date(l.created_at) : new Date(),
    }))
  ).onConflictDoNothing()
  console.log(`✓ Migrated ${existingLessons.length} lessons`)
}

// Progress
const existingProgress = sqlite.prepare('SELECT * FROM progress').all() as any[]
if (existingProgress.length > 0) {
  await db.insert(progress).values(
    existingProgress.map(p => ({
      id:           p.id,
      student_id:   p.student_id,
      lesson_id:    p.lesson_id,
      status:       p.status,
      score:        p.score ?? null,
      completed_at: p.completed_at ? new Date(p.completed_at) : null,
    }))
  ).onConflictDoNothing()
  console.log(`✓ Migrated ${existingProgress.length} progress rows`)
}

console.log('Migration complete.')
sqlite.close()
await client.end()
