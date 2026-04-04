'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/app/context'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewCommandPage() {
  const { currentStudent } = useApp()
  const t = useT()
  const router = useRouter()

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())        { setError(t.commandNameRequired); return }
    if (!description.trim()) { setError(t.commandDescRequired); return }
    if (!currentStudent)     { setError('No student selected'); return }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id:   currentStudent.id,
          command_name: name.trim(),
          description:  description.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t.commandNetworkError); return }
      router.push('/commands')
    } catch {
      setError(t.commandNetworkError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-heading font-semibold leading-tight">{t.newCommand}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t.commandName}</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-sm font-mono">/</span>
            <Input
              value={name}
              onChange={e => setName(e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase())}
              placeholder="polish"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t.commandNameHint}</p>
        </div>

        <div className="space-y-1.5">
          <Label>{t.commandDescription}</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t.commandDescHint}
            disabled={loading}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? t.commandGenerating : t.commandSave}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/commands')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
