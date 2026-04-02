'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useApp } from '@/app/context'
import { DomainPicker } from './domain-picker'
import { StudentPicker } from './student-picker'
import { DOMAINS } from '@/lib/domains'
import { Sun, Moon, LayoutDashboard, BookOpen, MessageCircle, BarChart2, Settings, Home, Languages } from 'lucide-react'
import { useState, useEffect } from 'react'

// Kanji badge characters per domain — mirrors the original brand-kanji style
const BRAND_KANJI: Record<string, string> = {
  japanese: '日',
  english:  'Ｅ',
  french:   '法',   // 法国 = France in Chinese/Japanese
  math:     '数',
}

const T = {
  en: {
    learning:      'Learning',
    nav: {
      '/dashboard': 'Dashboard',
      '/lessons':   'Lessons',
      '/chat':      'Ask Sensei',
      '/progress':  'Progress',
      '/admin':     'Admin',
    },
    lightMode:     'Light mode',
    darkMode:      'Dark mode',
    selectStudent: 'Select student',
  },
  'zh-TW': {
    learning:      '學習中',
    nav: {
      '/dashboard': '儀表板',
      '/lessons':   '課程',
      '/chat':      '問老師',
      '/progress':  '進度',
      '/admin':     '管理',
    },
    lightMode:     '淺色模式',
    darkMode:      '深色模式',
    selectStudent: '選擇學員',
  },
} as const

const NAV = [
  { href: '/dashboard', Icon: LayoutDashboard },
  { href: '/lessons',   Icon: BookOpen },
  { href: '/chat',      Icon: MessageCircle },
  { href: '/progress',  Icon: BarChart2 },
  { href: '/admin',     Icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { currentStudent, domain, homeDomain, setHomeDomain, uiLang, toggleUiLang } = useApp()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const t = T[uiLang]

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border">

      {/* Brand + domain picker */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 mb-3">
          {/* Kanji badge — accent-coloured square, matches original .brand-kanji */}
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-base font-bold font-jp">
            {BRAND_KANJI[domain] ?? DOMAINS[domain].icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-none text-sidebar-foreground">
              {DOMAINS[domain].name}
            </div>
            <div className="text-xs text-sidebar-foreground/60 mt-0.5">{t.learning}</div>
          </div>
          {/* UI language toggle */}
          <button
            onClick={toggleUiLang}
            title={uiLang === 'en' ? 'Switch to 繁中' : '切換至 English'}
            className="shrink-0 transition-colors cursor-pointer"
          >
            <Languages
              className={`h-4 w-4 ${
                uiLang === 'zh-TW'
                  ? 'text-primary'
                  : 'text-sidebar-foreground/30 hover:text-sidebar-foreground/70'
              }`}
            />
          </button>
          {/* Home domain toggle */}
          {currentStudent && (
            <button
              onClick={() => setHomeDomain(domain)}
              title={domain === homeDomain ? 'Home domain' : 'Set as home domain'}
              className="shrink-0 transition-colors cursor-pointer"
            >
              <Home
                className={`h-4 w-4 ${
                  domain === homeDomain
                    ? 'text-primary fill-primary'
                    : 'text-sidebar-foreground/30 hover:text-sidebar-foreground/70'
                }`}
              />
            </button>
          )}
        </div>
        <DomainPicker />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}>
              <span className={`flex items-center gap-2.5 h-9 rounded-md text-sm transition-colors cursor-pointer ${
                active
                  ? 'bg-sidebar-accent text-sidebar-foreground font-medium border-l-2 border-white/70 px-[10px]'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground px-3'
              }`}>
                <Icon className="h-4 w-4 shrink-0" />
                {t.nav[href]}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer: theme toggle + student picker */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          className="flex w-full items-center gap-2.5 h-9 px-3 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground transition-colors cursor-pointer"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && theme === 'dark'
            ? <Sun className="h-4 w-4 shrink-0" />
            : <Moon className="h-4 w-4 shrink-0" />}
          {mounted && theme === 'dark' ? t.lightMode : t.darkMode}
        </button>

        <button
          className="flex w-full items-center gap-2.5 h-9 px-3 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground transition-colors cursor-pointer"
          onClick={() => setPickerOpen(true)}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {currentStudent ? currentStudent.name[0].toUpperCase() : '?'}
          </span>
          <span className="truncate">
            {currentStudent ? currentStudent.name : t.selectStudent}
          </span>
        </button>
      </div>

      <StudentPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </aside>
  )
}
