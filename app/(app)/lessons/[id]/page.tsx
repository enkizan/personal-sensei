'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { LessonViewer } from '@/components/lesson-viewer'
import { QuizEngine } from '@/components/quiz-engine'

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const [lesson,    setLesson]    = useState<any>(null)
  const [quizMode,  setQuizMode]  = useState(false)

  useEffect(() => {
    fetch(`/api/lessons/${id}`).then(r => r.json()).then(setLesson)
  }, [id])

  if (!lesson) return <div className="p-6 text-muted-foreground">Loading…</div>
  if (quizMode) return <QuizEngine lesson={lesson} onExit={() => setQuizMode(false)} />
  return <LessonViewer lesson={lesson} onStartQuiz={() => setQuizMode(true)} />
}
