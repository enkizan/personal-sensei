'use client'
import { useEffect, useState } from 'react'
import { useApp } from '@/app/context'
import { DOMAINS } from '@/lib/domains'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Stats {
  total_students: number
  total_lessons:  number
  total_progress: number
  avg_score:      number | null
}

interface Lesson {
  id: number; level: string; topic: string; chapter: number; domain: string
}

export default function DashboardPage() {
  const { currentStudent, domain } = useApp()
  const [stats,  setStats]  = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Lesson[]>([])

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats)
    fetch(`/api/lessons?domain=${domain}`)
      .then(r => r.json())
      .then((rows: Lesson[]) => setRecent(rows.slice(-3).reverse()))
  }, [domain])

  const tutor = DOMAINS[domain]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">
          {domain === 'japanese' ? 'いらっしゃいませ' : 'Welcome back'}
          {currentStudent ? `, ${currentStudent.name}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Your {tutor.name} tutor is <strong>{tutor.tutor}</strong>
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Students',  value: stats.total_students },
            { label: 'Lessons',   value: stats.total_lessons },
            { label: 'Completed', value: stats.total_progress },
            { label: 'Avg score', value: stats.avg_score != null ? `${stats.avg_score}%` : '—' },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent lessons</h2>
        {recent.length === 0
          ? <p className="text-muted-foreground text-sm">No lessons yet. Generate one in Admin.</p>
          : recent.map(l => (
            <Link key={l.id} href={`/lessons/${l.id}`}>
              <Card className="mb-2 hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="py-3 flex items-center justify-between">
                  <span>{l.topic}</span>
                  <span className="text-xs text-muted-foreground uppercase">{l.level}</span>
                </CardContent>
              </Card>
            </Link>
          ))
        }
        <Button variant="outline" className="mt-2" asChild>
          <Link href="/lessons">All lessons →</Link>
        </Button>
      </div>
    </div>
  )
}
