'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'

export default function PasscodePage() {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const router = useRouter()

  async function submit() {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: value }),
    })
    if (res.ok) {
      router.push('/dashboard')
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
          <Input
            type="password"
            placeholder="Passcode"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            className={shake ? 'animate-shake border-destructive' : ''}
          />
          {error && <p className="text-destructive text-sm text-center">Incorrect passcode</p>}
          <Button type="submit" className="w-full">Enter</Button>
        </form>
      </div>
    </div>
  )
}
