'use client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface LessonViewerProps {
  lesson: {
    id: number; level: string; chapter: number; topic: string; domain: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any
  }
  onStartQuiz: () => void
}

export function LessonViewer({ lesson, onStartQuiz }: LessonViewerProps) {
  // Use lesson.domain (DB row), not context domain — so a Japanese lesson visited
  // while the context domain is "english" still shows the correct tabs (CN Notes, etc.)
  const lessonDomain = lesson.domain as string
  const c = lesson.content

  const tabs = [
    { key: 'content',  label: 'Content',    domains: ['japanese','english','french','math'] },
    { key: 'vocab',    label: 'Vocabulary', domains: ['japanese','english','french'] },
    { key: 'grammar',  label: 'Grammar',    domains: ['japanese','english','french'] },
    { key: 'concepts', label: 'Concepts',   domains: ['math'] },
    { key: 'worked',   label: 'Examples',   domains: ['math'] },
    { key: 'notes',    label: 'CN Notes',   domains: ['japanese','french'] },
    { key: 'quiz',     label: 'Quiz',       domains: ['japanese','english','french','math'] },
  ].filter(t => t.domains.includes(lessonDomain))

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold">{c.title}</h1>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="uppercase">{lesson.level}</Badge>
            <span className="text-sm text-muted-foreground">Chapter {lesson.chapter}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          {tabs.map(t => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
        </TabsList>

        {/* Content (all domains) */}
        <TabsContent value="content" className="mt-4">
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
            {c.content}
          </div>
        </TabsContent>

        {/* Vocabulary (Japanese / English) */}
        <TabsContent value="vocab" className="mt-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Word</th>
                {lessonDomain === 'japanese' && <th className="text-left py-2 pr-4">Reading</th>}
                {(lessonDomain === 'english' || lessonDomain === 'french') && <th className="text-left py-2 pr-4">Pronunciation</th>}
                {lessonDomain === 'french'   && <th className="text-left py-2 pr-4">Gender</th>}
                {lessonDomain === 'japanese' && <th className="text-left py-2 pr-4">中文</th>}
                <th className="text-left py-2">English</th>
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {c.vocabulary?.map((v: any, i: number) => (
                <tr key={i} className="border-b border-muted">
                  <td className="py-2 pr-4 font-medium">{v.word}</td>
                  {lessonDomain === 'japanese' && <td className="py-2 pr-4 text-muted-foreground">{v.reading}</td>}
                  {(lessonDomain === 'english' || lessonDomain === 'french') && <td className="py-2 pr-4 text-muted-foreground">{v.reading ?? v.pronunciation}</td>}
                  {lessonDomain === 'french'   && <td className="py-2 pr-4 text-muted-foreground">{v.gender}</td>}
                  {lessonDomain === 'japanese' && <td className="py-2 pr-4">{v.meaning_zh}</td>}
                  <td className="py-2">{v.meaning_en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        {/* Grammar (Japanese / English) */}
        <TabsContent value="grammar" className="mt-4 space-y-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {c.grammar_points?.map((g: any, i: number) => (
            <div key={i} className="rounded-lg border p-4">
              <p className="font-semibold text-primary">{g.pattern}</p>
              <p className="mt-1 text-sm">{g.explanation}</p>
              <p className="mt-2 text-sm text-muted-foreground italic">{g.example}</p>
            </div>
          ))}
        </TabsContent>

        {/* Concepts (Math) */}
        <TabsContent value="concepts" className="mt-4 space-y-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {c.concepts?.map((ct: any, i: number) => (
            <div key={i} className="rounded-lg border p-4">
              <p className="font-semibold">{ct.name}</p>
              <p className="mt-1 text-sm">{ct.definition}</p>
              <p className="mt-2 text-sm text-muted-foreground font-mono">{ct.example}</p>
            </div>
          ))}
        </TabsContent>

        {/* Worked Examples (Math) */}
        <TabsContent value="worked" className="mt-4 space-y-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {c.worked_examples?.map((w: any, i: number) => (
            <div key={i} className="rounded-lg border p-4">
              <p className="font-semibold">Problem: {w.problem}</p>
              <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {w.steps?.map((s: any, j: number) => <li key={j}>{s}</li>)}
              </ol>
              <p className="mt-2 font-medium text-primary">Answer: {w.solution}</p>
            </div>
          ))}
        </TabsContent>

        {/* Chinese Notes (Japanese only) */}
        <TabsContent value="notes" className="mt-4">
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
            {c.chinese_notes}
          </div>
        </TabsContent>

        {/* Quiz */}
        <TabsContent value="quiz" className="mt-4">
          <p className="text-muted-foreground mb-4">
            {c.quiz?.length ?? 0} questions — test your understanding.
          </p>
          <button
            onClick={onStartQuiz}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Start quiz
          </button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
