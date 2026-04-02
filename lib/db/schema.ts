import { pgTable, serial, text, integer, timestamp, jsonb, unique, boolean, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const students = pgTable('students', {
  id:              serial('id').primaryKey(),
  name:            text('name').notNull(),
  email:           text('email'),
  native_language: text('native_language').default('zh'),
  domain:          text('domain').default('japanese'),
  home_domain:     text('home_domain').default('japanese'),
  created_at:      timestamp('created_at').defaultNow(),
})

export const lessons = pgTable('lessons', {
  id:         serial('id').primaryKey(),
  level:      text('level').notNull(),
  chapter:    integer('chapter').notNull(),
  topic:      text('topic').notNull(),
  content:    jsonb('content').notNull(),
  contentZh:  jsonb('content_zh'),
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

export const chatConversations = pgTable('chat_conversations', {
  id:         serial('id').primaryKey(),
  student_id: integer('student_id').notNull().references(() => students.id),
  domain:     text('domain').notNull(),
  lesson_id:  integer('lesson_id').notNull().default(-1), // -1 = general domain thread
  is_active:  boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => ({
  // Partial unique index: only one active conversation per (student, domain, lesson) scope
  activeUnique: uniqueIndex('chat_conv_active_unique')
    .on(t.student_id, t.domain, t.lesson_id)
    .where(sql`${t.is_active} = true`),
}))

export const chatMessages = pgTable('chat_messages', {
  id:              serial('id').primaryKey(),
  conversation_id: integer('conversation_id').notNull().references(() => chatConversations.id),
  role:            text('role').notNull(), // 'user' | 'assistant'
  content:         text('content').notNull(),
  created_at:      timestamp('created_at').defaultNow(),
})

export type Student          = typeof students.$inferSelect
export type Lesson           = typeof lessons.$inferSelect
export type Progress         = typeof progress.$inferSelect
export type ChatConversation = typeof chatConversations.$inferSelect
export type ChatMessage      = typeof chatMessages.$inferSelect
