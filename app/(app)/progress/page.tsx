'use client'
import { useEffect, useState } from 'react'
import { useApp } from '@/app/context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ProgressRow {
  id: number; lesson_id: number; status: string; score: number | null; completed_at: string | null
}
interface Lesson { id: number; topic: string; level: string }

export default function ProgressPage() {
  const { currentStudent } = useApp()
  const [rows,      setRows]      = useState<ProgressRow[]>([])
  const [lessonMap, setLessonMap] = useState<Record<number, Lesson>>({})

  useEffect(() => {
    if (!currentStudent) return
    fetch(`/api/progress?student_id=${currentStudent.id}`)
      .then(r => r.json())
      .then(async (data: ProgressRow[]) => {
        setRows(data)
        const unique = [...new Set(data.map(d => d.lesson_id))]
        const lessons = await Promise.all(unique.map(id =>
          fetch(`/api/lessons/${id}`).then(r => r.json())
        ))
        setLessonMap(Object.fromEntries(lessons.map((l: Lesson) => [l.id, l])))
      })
  }, [currentStudent])

  if (!currentStudent) {
    return <p className="text-muted-foreground">Select a student to view progress.</p>
  }

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-3xl font-heading font-semibold leading-tight">Progress — {currentStudent.name}</h1>
      {rows.length === 0
        ? <p className="text-muted-foreground text-sm">No lessons started yet.</p>
        : rows.map(row => {
            const lesson = lessonMap[row.lesson_id]
            return (
              <Link key={row.id} href={`/lessons/${row.lesson_id}`}>
                <Card className="hover:bg-muted/50 cursor-pointer transition-colors mb-2">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{lesson?.topic ?? `Lesson ${row.lesson_id}`}</p>
                      {row.completed_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(row.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {row.score != null && (
                        <span className="text-sm font-medium">{row.score}%</span>
                      )}
                      <Badge variant={row.status === 'completed' ? 'default' : 'secondary'}>
                        {row.status === 'completed' ? 'Completed' : 'In progress'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
      }
    </div>
  )
}
