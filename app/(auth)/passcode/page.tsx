'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

export default function PasscodePage() {
  const searchParams = useSearchParams()
  const [value,   setValue]   = useState('')
  const [shake,   setShake]   = useState(false)
  const [visible, setVisible] = useState(false)

  // error=1 comes from the native form POST redirect on wrong passcode
  const serverError = searchParams.get('error') === '1'
  const [clientError, setClientError] = useState(false)
  const error = serverError || clientError

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  // JS-enhanced path: fetch so we get the shake animation on failure
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setClientError(false)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: value }),
    })
    if (res.ok) {
      // Hard redirect so the browser sends the new cookie to the middleware
      window.location.replace('/dashboard')
    } else {
      setValue('')
      setClientError(true)
      triggerShake()
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

        {/* method + action = native form POST fallback if JS fetch fails on iOS */}
        <form
          method="POST"
          action="/api/auth"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="relative">
            <Input
              name="passcode"
              type={visible ? 'text' : 'password'}
              placeholder="Passcode"
              value={value}
              onChange={e => { setValue(e.target.value); setClientError(false) }}
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
