'use client'
import { useState, useEffect, type CSSProperties } from 'react'
import { useApp } from '@/app/context'
import { getDomainLevels } from '@/lib/domains'
import { LessonCard } from '@/components/lesson-card'
import { MathLevelToggle } from '@/components/math-level-toggle'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useT, translateMathLabels } from '@/lib/i18n'

function levelStyle(index: number, total: number): CSSProperties {
  const t = total <= 1 ? 0 : index / (total - 1)
  // Lightness 0.78 (sky) → 0.38 (navy), chroma 0.09 → 0.17, hue 215 → 250
  const l = 0.78 - t * 0.40
  const c = 0.09 + t * 0.08
  const h = 215 + t * 35
  return {
    backgroundColor: `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h.toFixed(0)})`,
    color: l > 0.55 ? 'oklch(0.25 0.06 240)' : 'oklch(0.96 0.01 240)',
  }
}

interface Lesson { id: number; level: string; topic: string; chapter: number }
interface ProgressRow { lesson_id: number; status: string }

export default function LessonsPage() {
  const { domain, mathLevelMode, currentStudent } = useApp()
  const t = useT()
  const { keys, labels: rawLabels } = getDomainLevels(domain, mathLevelMode)
  // For math, swap in translated labels; other domains keep their own label strings
  const labels = domain === 'math' ? translateMathLabels(mathLevelMode, t) : rawLabels
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
    <div className="max-w-3xl space-y-10">
      <h1 className="text-3xl font-heading font-semibold leading-tight">{t.lessonsHeading}</h1>
      {domain === 'math' && <MathLevelToggle />}
      <Tabs value={activeLevel} onValueChange={loadLevel}>
        <TabsList className="flex-wrap h-auto gap-1">
          {keys.map((k, i) => (
            <TabsTrigger key={k} value={k} style={levelStyle(i, keys.length)}>{labels[i]}</TabsTrigger>
          ))}
        </TabsList>
        {keys.map(k => (
          <TabsContent key={k} value={k} className="mt-4 space-y-2">
            {lessons.length === 0
              ? <p className="text-muted-foreground text-sm">{t.noLessons}</p>
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
