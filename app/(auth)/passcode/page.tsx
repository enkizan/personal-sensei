'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

export default function PasscodePage() {
  const [value,   setValue]   = useState('')
  const [error,   setError]   = useState(false)
  const [shake,   setShake]   = useState(false)
  const [visible, setVisible] = useState(false)

  async function submit() {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: value }),
    })
    if (res.ok) {
      window.location.href = '/dashboard'
    } else {
      setValue('')
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-4 p-8 rounded-xl border bg-card shadow-md">
        <div className="text-center space-y-1">
          <div className="text-5xl font-bold">日</div>
          <h1 className="text-xl font-semibold">Learning Platform</h1>
          <p className="text-muted-foreground text-sm">Enter the passcode to continue</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-4">
          <div className="relative">
            <Input
              type={visible ? 'text' : 'password'}
              placeholder="Passcode"
              value={value}
              onChange={e => { setValue(e.target.value); setError(false) }}
              className={`pr-10 ${shake ? 'animate-shake border-destructive' : ''}`}
            />
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-destructive text-sm text-center">Incorrect passcode</p>}
          <Button type="submit" className="w-full">Enter</Button>
        </form>
      </div>
    </div>
  )
}
