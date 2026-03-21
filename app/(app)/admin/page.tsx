'use client'
import { useState } from 'react'
import { useApp } from '@/app/context'
import { getDomainLevels } from '@/lib/domains'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  const { domain, mathLevelMode } = useApp()
  const { keys, labels } = getDomainLevels(domain, mathLevelMode)

  const [level,   setLevel]   = useState(keys[0])
  const [chapter, setChapter] = useState('1')
  const [topic,   setTopic]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<any>(null)
  const [error,   setError]   = useState('')

  async function generate() {
    if (!topic.trim()) { setError('Topic is required'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, level, chapter: parseInt(chapter), topic }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Generation failed'); return }
      setResult(data)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Admin — Generate Lesson</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">New lesson</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Level</Label>
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              {keys.map((k, i) => <option key={k} value={k}>{labels[i]}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Chapter</Label>
            <Input type="number" min="1" value={chapter}
              onChange={e => setChapter(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Topic</Label>
            <Input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder={
                domain === 'japanese' ? 'e.g. Greetings'
                : domain === 'math'    ? 'e.g. Quadratic equations'
                :                        'e.g. Present perfect'
              }
              onKeyDown={e => e.key === 'Enter' && generate()} />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button className="w-full" onClick={generate} disabled={loading}>
            {loading ? 'Generating (~20s)…' : 'Generate lesson'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="pt-4">
            <p className="font-medium">✓ Lesson created: <strong>{result.content?.title}</strong></p>
            <a href={`/lessons/${result.id}`}
              className="text-primary text-sm underline mt-1 block">
              Open lesson →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
