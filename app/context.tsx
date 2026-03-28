'use client'
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Domain, MathLevelMode } from '@/lib/domains'
import type { Student } from '@/lib/db/schema'

export type UiLang = 'en' | 'zh-TW'

interface AppState {
  currentStudent:  Student | null
  domain:          Domain
  homeDomain:      Domain
  mathLevelMode:   MathLevelMode
  uiLang:          UiLang
  setStudent:      (s: Student | null) => void
  switchDomain:    (d: Domain) => Promise<void>
  setHomeDomain:   (d: Domain) => Promise<void>
  setMathLevelMode:(m: MathLevelMode) => void
  toggleUiLang:   () => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({
  children,
  initialStudent,
}: {
  children: ReactNode
  initialStudent: Student | null
}) {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(initialStudent)
  const [domain, setDomain] = useState<Domain>(
    (initialStudent?.home_domain as Domain) ?? (initialStudent?.domain as Domain) ?? 'japanese'
  )
  const [homeDomain, setHomeDomainState] = useState<Domain>(
    (initialStudent?.home_domain as Domain) ?? 'japanese'
  )
  const [mathLevelMode, setMathLevelMode] = useState<MathLevelMode>('topic')
  const [uiLang, setUiLang] = useState<UiLang>('en')

  // Hydrate uiLang from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem('uiLang')
    if (stored === 'zh-TW' || stored === 'en') setUiLang(stored)
  }, [])

  const setStudent = useCallback((s: Student | null) => {
    setCurrentStudent(s)
    if (s) {
      const home = (s.home_domain as Domain) ?? (s.domain as Domain) ?? 'japanese'
      setDomain(home)
      setHomeDomainState((s.home_domain as Domain) ?? 'japanese')
      document.cookie = `jp_student_id=${s.id}; path=/`
      document.documentElement.dataset.domain = home
    }
  }, [])

  const switchDomain = useCallback(async (d: Domain) => {
    setDomain(d)
    document.documentElement.dataset.domain = d
    if (currentStudent) {
      await fetch(`/api/students/${currentStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d }),
      })
    }
  }, [currentStudent])

  const setHomeDomain = useCallback(async (d: Domain) => {
    setHomeDomainState(d)
    if (currentStudent) {
      await fetch(`/api/students/${currentStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_domain: d }),
      })
    }
  }, [currentStudent])

  const toggleUiLang = useCallback(() => {
    setUiLang(prev => {
      const next: UiLang = prev === 'en' ? 'zh-TW' : 'en'
      localStorage.setItem('uiLang', next)
      return next
    })
  }, [])

  return (
    <AppContext.Provider value={{
      currentStudent, domain, homeDomain, mathLevelMode, uiLang,
      setStudent, switchDomain, setHomeDomain, setMathLevelMode, toggleUiLang,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
