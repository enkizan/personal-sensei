'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/app/context'
import { getDomainLevels } from '@/lib/domains'
import { LessonCard } from '@/components/lesson-card'
import { MathLevelToggle } from '@/components/math-level-toggle'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Lesson { id: number; level: string; topic: string; chapter: number }
interface ProgressRow { lesson_id: number; status: string }

export default function LessonsPage() {
  const { domain, mathLevelMode, currentStudent } = useApp()
  const { keys, labels } = getDomainLevels(domain, mathLevelMode)
  const [lessons,     setLessons]     = useState<Lesson[]>([])
  const [progressMap, setProgressMap] = useState<Record<number, string>>({})
  const [activeLevel, setActiveLevel] = useState(keys[0])

  useEffect(() => {
    setActiveLevel(keys[0])
    loadLevel(keys[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, mathLevelMode])

  useEffect(() => {
    if (!currentStudent) return
    fetch(`/api/progress?student_id=${currentStudent.id}`)
      .then(r => r.json())
      .then((rows: ProgressRow[]) =>
        setProgressMap(Object.fromEntries(rows.map(r => [r.lesson_id, r.status])))
      )
  }, [currentStudent])

  function loadLevel(level: string) {
    setActiveLevel(level)
    fetch(`/api/lessons?domain=${domain}&level=${level}`)
      .then(r => r.json()).then(setLessons)
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Lessons</h1>
      {domain === 'math' && <MathLevelToggle />}
      <Tabs value={activeLevel} onValueChange={loadLevel}>
        <TabsList className="flex-wrap h-auto gap-1">
          {keys.map((k, i) => (
            <TabsTrigger key={k} value={k}>{labels[i]}</TabsTrigger>
          ))}
        </TabsList>
        {keys.map(k => (
          <TabsContent key={k} value={k} className="mt-4 space-y-2">
            {lessons.length === 0
              ? <p className="text-muted-foreground text-sm">No lessons at this level yet.</p>
              : lessons.map(l => (
                <LessonCard key={l.id} {...l}
                  status={progressMap[l.id] as 'in_progress' | 'completed' | null ?? null} />
              ))
            }
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
