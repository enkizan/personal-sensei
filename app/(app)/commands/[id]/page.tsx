'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function EditCommandPage() {
  const { id } = useParams<{ id: string }>()
  const t      = useT()
  const router = useRouter()

  const [description, setDescription] = useState('')
  const [prompt,      setPrompt]      = useState('')
  const [cmdName,     setCmdName]     = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    fetch(`/api/commands/${id}`)
      .then(r => r.json())
      .then(data => {
        setCmdName(data.command_name)
        setDescription(data.description)
        setPrompt(data.prompt)
        setLoadingData(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setError(t.commandDescRequired); return }

    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/commands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), prompt: prompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t.commandNetworkError); return }
      router.push('/commands')
    } catch {
      setError(t.commandNetworkError)
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) return <div className="text-muted-foreground text-sm">Loading…</div>

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-heading font-semibold leading-tight">
        <span className="font-mono text-primary">/{cmdName}</span>
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t.commandDescription}</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={saving}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t.commandPromptLabel}</Label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={saving}
            rows={5}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">Saving will send this to AI to regenerate based on your description.</p>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? t.commandGenerating : t.commandUpdate}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/commands')} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
