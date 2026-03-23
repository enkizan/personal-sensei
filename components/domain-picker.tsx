'use client'
import { useApp } from '@/app/context'
import { DOMAINS, type Domain } from '@/lib/domains'
import { ChevronDown, Home } from 'lucide-react'
import { useState } from 'react'

export function DomainPicker() {
  const { domain, homeDomain, switchDomain } = useApp()
  const [open, setOpen] = useState(false)
  const current = DOMAINS[domain]

  // Home domain always first, rest in original DOMAINS key order
  const domainKeys: Domain[] = [
    homeDomain,
    ...(Object.keys(DOMAINS) as Domain[]).filter(k => k !== homeDomain),
  ]

  return (
    <div className="relative">
      <button
        className="flex w-full items-center justify-between h-9 px-3 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{current.icon}</span>
          <span className="font-medium">{current.name}</span>
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-card shadow-lg">
          {domainKeys.map(key => (
            <button
              key={key}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
              onClick={() => { switchDomain(key); setOpen(false) }}
            >
              <span className="text-base font-bold w-6 text-center">{DOMAINS[key].icon}</span>
              <span className="flex-1 text-left">{DOMAINS[key].name}</span>
              {key === homeDomain
                ? <Home className="h-3.5 w-3.5 text-primary fill-primary" />
                : key === domain && <span className="text-primary text-xs">✓</span>
              }
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
