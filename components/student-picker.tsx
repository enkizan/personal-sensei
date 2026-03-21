'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/app/context'
import type { Student } from '@/lib/db/schema'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'

interface Props { open: boolean; onClose: () => void }

export function StudentPicker({ open, onClose }: Props) {
  const { setStudent } = useApp()
  const [students, setStudents] = useState<Student[]>([])
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (open) fetch('/api/students').then(r => r.json()).then(setStudents)
  }, [open])

  async function createStudent() {
    if (!newName.trim()) return
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const s = await res.json()
    setStudent(s)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Who&apos;s studying?</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {students.map(s => (
            <Button key={s.id} variant="outline" className="w-full justify-start"
              onClick={() => { setStudent(s); onClose() }}>
              {s.name}
            </Button>
          ))}
        </div>
        <div className="border-t pt-4 space-y-2">
          <Input placeholder="New student name"
            value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createStudent()} />
          <Button className="w-full" onClick={createStudent}>Add student</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
