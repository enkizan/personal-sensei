'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { LessonViewer } from '@/components/lesson-viewer'
import { QuizEngine } from '@/components/quiz-engine'
import { Waves } from 'lucide-react'

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const [lesson,    setLesson]    = useState<any>(null)
  const [quizMode,  setQuizMode]  = useState(false)
  const [diving,    setDiving]    = useState(false)
  const [diveStep,  setDiveStep]  = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/lessons/${id}`).then(r => r.json()).then(setLesson)
  }, [id])

  async function handleDive() {
    setDiving(true)
    setDiveStep('Analysing current content…')
    try {
      // Small delay so the first message is visible before the network call blocks
      await new Promise(r => setTimeout(r, 400))
      setDiveStep('Generating deeper content…')
      const res  = await fetch(`/api/lessons/${id}/dive`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setLesson(updated)
      setDiveStep(null)
    } catch (err) {
      setDiveStep(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDiving(false)
    }
  }

  if (!lesson) return <div className="p-6 text-muted-foreground">Loading…</div>
  if (quizMode) return <QuizEngine lesson={lesson} onExit={() => setQuizMode(false)} />

  return (
    <div className="space-y-4">
      <LessonViewer lesson={lesson} onStartQuiz={() => setQuizMode(true)} />

      {/* Dive button — sits below the lesson viewer */}
      <div className="max-w-3xl border-t pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleDive}
            disabled={diving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Waves className={`h-4 w-4 ${diving ? 'animate-pulse' : ''}`} />
            {diving ? 'Diving…' : 'Dive deeper'}
          </button>

          {diveStep && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {diving && (
                <span className="inline-block h-3 w-3 rounded-full bg-primary animate-pulse shrink-0" />
              )}
              {diveStep}
            </div>
          )}
        </div>

        {!diving && !diveStep && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Analyses this lesson, then generates fresh vocabulary, grammar, and content that goes deeper — without repeating what&apos;s already here.
          </p>
        )}
      </div>
    </div>
  )
}
