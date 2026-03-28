'use client'
import { useApp } from '@/app/context'
import { type MathLevelMode } from '@/lib/domains'
import { useT } from '@/lib/i18n'

const MODE_KEYS: MathLevelMode[] = ['topic', 'tier', 'combined']

export function MathLevelToggle() {
  const { mathLevelMode, setMathLevelMode } = useApp()
  const t = useT()

  return (
    <div className="flex rounded-lg border overflow-hidden w-fit">
      {MODE_KEYS.map(key => (
        <button key={key}
          onClick={() => setMathLevelMode(key)}
          className={`px-3 py-1.5 text-sm transition-colors ${
            mathLevelMode === key
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}>
          {t.mathMode[key]}
        </button>
      ))}
    </div>
  )
}
