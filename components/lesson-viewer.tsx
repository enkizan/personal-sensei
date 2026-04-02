'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Sparkles, MessageCircle } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { useApp } from '@/app/context'

function AskSenseiBtn({ content, lessonId }: { content: string; lessonId: number }) {
  const router = useRouter()
  const q = encodeURIComponent(`Please dive deeper and explain: "${content}"`)
  return (
    <button
      onClick={() => router.push(`/chat?q=${q}&lesson_id=${lessonId}`)}
      title="Ask Sensei"
      className="ml-1.5 inline-flex items-center text-muted-foreground hover:text-primary transition-colors align-middle"
    >
      <MessageCircle className="h-3.5 w-3.5" />
    </button>
  )
}

interface LessonViewerProps {
  lesson: {
    id: number; level: string; chapter: number; topic: string; domain: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contentZh?: any
  }
  onStartQuiz: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLessonUpdate?: (updated: any) => void
}

export function LessonViewer({ lesson, onStartQuiz, onLessonUpdate }: LessonViewerProps) {
  const lessonDomain = lesson.domain as string
  const t = useT()
  const { uiLang } = useApp()
  const isMath    = lessonDomain === 'math'
  const useZh     = uiLang === 'zh-TW' && isMath
  const cZh       = lesson.contentZh ?? null

  const [translating,    setTranslating]    = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [retryCount,     setRetryCount]     = useState(0)

  useEffect(() => {
    if (!useZh || cZh != null || translating) return
    setTranslating(true)
    setTranslateError(null)
    fetch(`/api/lessons/${lesson.id}/translate-zh`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        onLessonUpdate?.({ ...lesson, contentZh: data.contentZh })
      })
      .catch(err => setTranslateError(err instanceof Error ? err.message : String(err)))
      .finally(() => setTranslating(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useZh, lesson.id, cZh, retryCount])

  const c = (useZh && cZh) ? cZh : lesson.content

  // Track which grammar cards are expanded, and which are generating
  const [expandedGrammar, setExpandedGrammar] = useState<Set<number>>(new Set())
  const [generatingGrammar, setGeneratingGrammar] = useState<Set<number>>(new Set())

  async function handleGenerateExamples(grammarIndex: number) {
    setGeneratingGrammar(prev => new Set(prev).add(grammarIndex))
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/grammar-examples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammar_index: grammarIndex }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      onLessonUpdate?.(updated)
      // Keep expanded after generating
      setExpandedGrammar(prev => new Set(prev).add(grammarIndex))
    } catch (err) {
      console.error('Failed to generate examples:', err)
    } finally {
      setGeneratingGrammar(prev => { const s = new Set(prev); s.delete(grammarIndex); return s })
    }
  }

  const tabs = [
    { key: 'content',  label: lessonDomain === 'math' ? t.tabContent  : 'Content',    domains: ['japanese','english','french','math'] },
    { key: 'vocab',    label: 'Vocabulary', domains: ['japanese','english','french'] },
    { key: 'grammar',  label: 'Grammar',    domains: ['japanese','english','french'] },
    { key: 'concepts', label: t.tabConcepts,  domains: ['math'] },
    { key: 'worked',   label: t.tabExamples,  domains: ['math'] },
    { key: 'notes',    label: 'CN Notes',   domains: ['japanese','french'] },
    { key: 'quiz',     label: lessonDomain === 'math' ? t.tabQuiz     : 'Quiz',       domains: ['japanese','english','french','math'] },
  ].filter(tab => tab.domains.includes(lessonDomain))

  return (
    <div className="max-w-3xl space-y-4">
      {/* ZH translation loading / error state — math only */}
      {useZh && cZh == null && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
          {translating && (
            <span className="inline-block h-3 w-3 rounded-full bg-primary animate-pulse shrink-0" />
          )}
          {translating
            ? t.translating
            : translateError
              ? (
                <span className="flex items-center gap-3">
                  {t.translateError}
                  <button
                    onClick={() => { setTranslateError(null); setRetryCount(n => n + 1) }}
                    className="underline hover:text-foreground"
                  >
                    {t.translateRetry}
                  </button>
                </span>
              )
            : null}
        </div>
      )}

      <div className="flex items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold">{c.title}</h1>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="uppercase">{lesson.level}</Badge>
            <span className="text-sm text-muted-foreground">
              {lessonDomain === 'math' && t.chapter !== 'Chapter'
                ? `${t.chapter} ${lesson.chapter} 章`
                : `Chapter ${lesson.chapter}`}
            </span>
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
                <th className="text-left py-2 pr-4">English</th>
                <th className="py-2 w-6" />
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
                  <td className="py-2 pr-4">{v.meaning_en}</td>
                  <td className="py-2"><AskSenseiBtn content={v.word} lessonId={lesson.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        {/* Grammar (Japanese / English / French) */}
        <TabsContent value="grammar" className="mt-4 space-y-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {c.grammar_points?.map((g: any, i: number) => {
            const extraExamples: string[] = g.examples ?? []
            const isExpanded  = expandedGrammar.has(i)
            const isGenerating = generatingGrammar.has(i)

            return (
              <div key={i} className="rounded-lg border">
                {/* Header — always visible */}
                <div className="p-4">
                  <p className="font-semibold text-primary">
                    {g.pattern}
                    <AskSenseiBtn content={g.pattern} lessonId={lesson.id} />
                  </p>
                  <p className="mt-1 text-sm">
                    {g.explanation}
                    <AskSenseiBtn content={g.explanation} lessonId={lesson.id} />
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground italic">
                    {g.example}
                    <AskSenseiBtn content={g.example} lessonId={lesson.id} />
                  </p>
                </div>

                {/* Examples section */}
                <div className="border-t">
                  {/* Toggle row */}
                  <button
                    onClick={() => setExpandedGrammar(prev => {
                      const s = new Set(prev)
                      s.has(i) ? s.delete(i) : s.add(i)
                      return s
                    })}
                    className="flex w-full items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  >
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                    Examples
                    {extraExamples.length > 0 && (
                      <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                        {extraExamples.length}
                      </span>
                    )}
                  </button>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {extraExamples.length > 0
                        ? (
                          <ol className="space-y-1.5 text-sm list-decimal list-inside marker:text-muted-foreground">
                            {extraExamples.map((ex, j) => (
                              <li key={j} className="text-muted-foreground italic">
                                {ex}
                                <AskSenseiBtn content={ex} lessonId={lesson.id} />
                              </li>
                            ))}
                          </ol>
                        )
                        : !isGenerating && (
                          <p className="text-xs text-muted-foreground">
                            No extra examples yet. Generate some below.
                          </p>
                        )}

                      <button
                        onClick={() => handleGenerateExamples(i)}
                        disabled={isGenerating}
                        className="mt-2 flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${isGenerating ? 'animate-pulse' : ''}`} />
                        {isGenerating ? 'Generating…' : 'Generate examples'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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
              <p className="font-semibold">{t.problem}: {w.problem}</p>
              <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {w.steps?.map((s: any, j: number) => <li key={j}>{s}</li>)}
              </ol>
              <p className="mt-2 font-medium text-primary">{t.answer}: {w.solution}</p>
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
            {t.questionsHint(c.quiz?.length ?? 0)}
          </p>
          <button
            onClick={onStartQuiz}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            {t.startQuiz}
          </button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
