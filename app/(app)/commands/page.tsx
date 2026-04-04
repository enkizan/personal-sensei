'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/app/context'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Terminal } from 'lucide-react'

interface Command {
  id: number
  command_name: string
  description: string
  prompt: string
}

export default function CommandsPage() {
  const { currentStudent } = useApp()
  const t = useT()
  const router = useRouter()
  const [commands, setCommands] = useState<Command[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!currentStudent) { setLoading(false); return }
    fetch(`/api/commands?student_id=${currentStudent.id}`)
      .then(r => r.json())
      .then(rows => { setCommands(rows); setLoading(false) })
  }, [currentStudent])

  async function handleDelete(id: number) {
    if (!confirm(t.commandDeleteConfirm)) return
    await fetch(`/api/commands/${id}`, { method: 'DELETE' })
    setCommands(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-semibold leading-tight">{t.commandsHeading}</h1>
        <Button onClick={() => router.push('/commands/new')} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t.newCommand}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : commands.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t.noCommands}</p>
      ) : (
        <div className="space-y-2">
          {commands.map(cmd => (
            <div key={cmd.id}
              className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <Terminal className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-semibold text-primary">/{cmd.command_name}</div>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{cmd.description}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                  onClick={() => router.push(`/commands/${cmd.id}`)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(cmd.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
