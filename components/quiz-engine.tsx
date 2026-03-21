'use client'
import { useState } from 'react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface QuizItem {
  question: string; options: string[]; answer: number; explanation: string
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lesson: { id: number; content: { quiz: QuizItem[]; title: string } & Record<string, any> }
  onExit: () => void
}

export function QuizEngine({ lesson, onExit }: Props) {
  const { currentStudent } = useApp()
  const questions = lesson.content.quiz ?? []

  const [current,  setCurrent]  = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers,  setAnswers]  = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [finished, setFinished] = useState(false)
  const [score,    setScore]    = useState(0)

  function choose(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const updated = [...answers]
    updated[current] = idx
    setAnswers(updated)
  }

  function next() {
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1)
      setSelected(null)
    } else {
      finish()
    }
  }

  async function finish() {
    const correct = answers.filter((a, i) => a === questions[i].answer).length
    const pct = Math.round((correct / questions.length) * 100)
    setScore(pct)
    setFinished(true)

    if (currentStudent) {
      await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: currentStudent.id, lesson_id: lesson.id, score: pct }),
      })
    }
  }

  if (finished) {
    return (
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <h2 className="text-3xl font-bold">{score}%</h2>
        <p className="text-muted-foreground">
          {score >= 80 ? 'Great work! 🎉' : score >= 60 ? 'Good effort!' : 'Keep practising!'}
        </p>
        <div className="space-y-2 text-left">
          {questions.map((q, i) => (
            <div key={i} className={`rounded-lg p-3 text-sm border ${
              answers[i] === q.answer
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
            }`}>
              <p className="font-medium">{q.question}</p>
              <p className="mt-1 text-muted-foreground">{q.explanation}</p>
            </div>
          ))}
        </div>
        <Button onClick={onExit}>Back to lesson</Button>
      </div>
    )
  }

  const q = questions[current]

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Q {current + 1} / {questions.length}</span>
        <Button variant="ghost" size="sm" onClick={onExit}>Exit quiz</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="font-medium text-lg">{q.question}</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let variant: 'outline' | 'default' | 'secondary' = 'outline'
          if (selected !== null) {
            if (i === q.answer)    variant = 'default'
            else if (i === selected) variant = 'secondary'
          }
          return (
            <Button key={i} variant={variant}
              className="w-full justify-start text-left h-auto py-3 px-4 whitespace-normal"
              onClick={() => choose(i)}>
              <Badge variant="outline" className="mr-3 shrink-0">{String.fromCharCode(65 + i)}</Badge>
              {opt}
            </Button>
          )
        })}
      </div>

      {selected !== null && (
        <div className={`rounded-lg p-3 text-sm ${
          selected === q.answer
            ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
            : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
        }`}>
          {q.explanation}
        </div>
      )}

      {selected !== null && (
        <Button className="w-full" onClick={next}>
          {current + 1 < questions.length ? 'Next question' : 'Finish quiz'}
        </Button>
      )}
    </div>
  )
}
