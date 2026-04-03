'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/app/context'
import { getDomainLevels } from '@/lib/domains'
import { useT, translateMathLabels } from '@/lib/i18n'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'

interface Props { open: boolean; onClose: () => void }

export function GenerateModal({ open, onClose }: Props) {
  const router = useRouter()
  const { domain, mathLevelMode } = useApp()
  const t = useT()
  const { keys, labels: rawLabels } = getDomainLevels(domain, mathLevelMode)
  const labels = domain === 'math' ? translateMathLabels(mathLevelMode, t) : rawLabels

  const [level,   setLevel]   = useState(keys[0])
  const [chapter, setChapter] = useState('1')
  const [topic,   setTopic]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<any>(null)
  const [error,   setError]   = useState('')

  function handleClose() {
    if (loading) return
    setResult(null); setError(''); setTopic(''); setLoading(false)
    onClose()
  }

  async function generate() {
    if (!topic.trim()) { setError(t.adminTopicRequired); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, level, chapter: parseInt(chapter), topic }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t.adminGenerateFailed); return }
      setResult(data)
    } catch {
      setError(t.adminNetworkError)
    } finally {
      setLoading(false)
    }
  }

  const placeholder =
    domain === 'japanese' ? t.adminPlaceholderJp
    : domain === 'math'   ? t.adminPlaceholderMath
    :                       t.adminPlaceholderOther

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.adminNewLesson}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t.adminLevel}</Label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm cursor-pointer"
            >
              {keys.map((k, i) => <option key={k} value={k}>{labels[i]}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>{t.adminChapter}</Label>
            <Input type="number" min="1" value={chapter}
              onChange={e => setChapter(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>{t.adminTopic}</Label>
            <Input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={placeholder}
              onKeyDown={e => e.key === 'Enter' && !loading && generate()}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          {result && (
            <div className="rounded-lg bg-muted/40 border px-3 py-2.5 text-sm space-y-1">
              <p className="font-medium text-foreground">
                {t.adminCreated} <span className="text-primary">{result.content?.title}</span>
              </p>
              <button
                onClick={() => { router.push(`/lessons/${result.id}`); handleClose() }}
                className="text-primary text-xs underline underline-offset-2 hover:opacity-80 cursor-pointer"
              >
                {t.adminOpen}
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={generate} disabled={loading}>
            {loading ? t.adminGenerating : t.adminGenerate}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
