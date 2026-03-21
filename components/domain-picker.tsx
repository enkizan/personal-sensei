'use client'
import { useApp } from '@/app/context'
import { DOMAINS, type Domain } from '@/lib/domains'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function DomainPicker() {
  const { domain, switchDomain } = useApp()
  const [open, setOpen] = useState(false)
  const current = DOMAINS[domain]

  return (
    <div className="relative">
      <Button variant="ghost" className="w-full justify-between px-3 h-10"
        onClick={() => setOpen(o => !o)}>
        <span className="flex items-center gap-2">
          <span className="text-lg font-bold">{current.icon}</span>
          <span className="text-sm font-medium">{current.name}</span>
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-card shadow-lg">
          {(Object.keys(DOMAINS) as Domain[]).map(key => (
            <button
              key={key}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => { switchDomain(key); setOpen(false) }}
            >
              <span className="text-base font-bold w-6 text-center">{DOMAINS[key].icon}</span>
              <span>{DOMAINS[key].name}</span>
              {key === domain && <span className="ml-auto text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
