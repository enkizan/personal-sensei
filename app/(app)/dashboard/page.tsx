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
    <div className="space-y-10 max-w-3xl">
      <div>
        <h1 className="text-3xl font-heading font-semibold leading-tight">
          {domain === 'japanese' ? 'いらっしゃいませ' : 'Welcome back'}
          {currentStudent ? `, ${currentStudent.name}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Your {tutor.name} tutor is <strong>{tutor.tutor}</strong>
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Students',  value: stats.total_students },
            { label: 'Lessons',   value: stats.total_lessons },
            { label: 'Completed', value: stats.total_progress },
            { label: 'Avg score', value: stats.avg_score != null ? `${stats.avg_score}%` : '—' },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold font-sans">{value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Recent lessons</h2>
        {recent.length === 0
          ? <p className="text-muted-foreground text-sm">No lessons yet. Generate one in Admin.</p>
          : <div className="flex flex-col gap-3">
              {recent.map(l => (
                <Link key={l.id} href={`/lessons/${l.id}`}>
                  <Card className="hover:bg-muted/50 cursor-pointer transition-colors border-l-4 border-primary">
                    <CardContent className="py-5 flex items-center justify-between">
                      <span className="font-heading font-medium">{l.topic}</span>
                      <span className="text-xs text-muted-foreground uppercase">{l.level}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
        }
        <Link href="/lessons">
          <Button variant="outline" className="mt-4">All lessons →</Button>
        </Link>
      </div>
    </div>
  )
}
