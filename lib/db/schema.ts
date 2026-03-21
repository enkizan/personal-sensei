import { pgTable, serial, text, integer, timestamp, jsonb, unique } from 'drizzle-orm/pg-core'

export const students = pgTable('students', {
  id:              serial('id').primaryKey(),
  name:            text('name').notNull(),
  email:           text('email'),
  native_language: text('native_language').default('zh'),
  domain:          text('domain').default('japanese'),
  created_at:      timestamp('created_at').defaultNow(),
})

export const lessons = pgTable('lessons', {
  id:         serial('id').primaryKey(),
  level:      text('level').notNull(),
  chapter:    integer('chapter').notNull(),
  topic:      text('topic').notNull(),
  content:    jsonb('content').notNull(),
  domain:     text('domain').default('japanese'),
  created_at: timestamp('created_at').defaultNow(),
})

export const progress = pgTable('progress', {
  id:           serial('id').primaryKey(),
  student_id:   integer('student_id').notNull().references(() => students.id),
  lesson_id:    integer('lesson_id').notNull().references(() => lessons.id),
  status:       text('status').default('in_progress'),
  score:        integer('score'),
  completed_at: timestamp('completed_at'),
}, t => ({ uniq: unique().on(t.student_id, t.lesson_id) }))

export type Student  = typeof students.$inferSelect
export type Lesson   = typeof lessons.$inferSelect
export type Progress = typeof progress.$inferSelect
