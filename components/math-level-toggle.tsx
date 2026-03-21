'use client'
import { useApp } from '@/app/context'
import { MATH_LEVEL_MODES, type MathLevelMode } from '@/lib/domains'

const MODES: { key: MathLevelMode; label: string }[] = [
  { key: 'topic',    label: 'Topic' },
  { key: 'tier',     label: 'Tier' },
  { key: 'combined', label: 'Combined' },
]

export function MathLevelToggle() {
  const { mathLevelMode, setMathLevelMode } = useApp()

  return (
    <div className="flex rounded-lg border overflow-hidden w-fit">
      {MODES.map(({ key, label }) => (
        <button key={key}
          onClick={() => setMathLevelMode(key)}
          className={`px-3 py-1.5 text-sm transition-colors ${
            mathLevelMode === key
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}>
          {label}
        </button>
      ))}
    </div>
  )
}
