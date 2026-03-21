'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useApp } from '@/app/context'
import { DomainPicker } from './domain-picker'
import { StudentPicker } from './student-picker'
import { DOMAINS } from '@/lib/domains'
import { Sun, Moon, LayoutDashboard, BookOpen, MessageCircle, BarChart2, Settings } from 'lucide-react'
import { useState } from 'react'

// Kanji badge characters per domain — mirrors the original brand-kanji style
const BRAND_KANJI: Record<string, string> = {
  japanese: '日',
  english:  'Ｅ',
  french:   '法',   // 法国 = France in Chinese/Japanese
  math:     '数',
}

const NAV = [
  { href: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { href: '/lessons',   label: 'Lessons',    Icon: BookOpen },
  { href: '/chat',      label: 'Ask Sensei', Icon: MessageCircle },
  { href: '/progress',  label: 'Progress',   Icon: BarChart2 },
  { href: '/admin',     label: 'Admin',      Icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { currentStudent, domain } = useApp()
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border">

      {/* Brand + domain picker */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 mb-3">
          {/* Kanji badge — accent-coloured square, matches original .brand-kanji */}
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-base font-bold font-jp">
            {BRAND_KANJI[domain] ?? DOMAINS[domain].icon}
          </span>
          <div>
            <div className="text-sm font-semibold leading-none text-sidebar-foreground">
              {DOMAINS[domain].name}
            </div>
            <div className="text-xs text-sidebar-foreground/60 mt-0.5">Learning</div>
          </div>
        </div>
        <DomainPicker />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}>
              <span className={`flex items-center gap-2.5 h-9 px-3 rounded-md text-sm transition-colors cursor-pointer ${
                active
                  ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
              }`}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer: theme toggle + student picker */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          className="flex w-full items-center gap-2.5 h-9 px-3 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground transition-colors"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark'
            ? <Sun className="h-4 w-4 shrink-0" />
            : <Moon className="h-4 w-4 shrink-0" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <button
          className="flex w-full items-center gap-2.5 h-9 px-3 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground transition-colors"
          onClick={() => setPickerOpen(true)}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {currentStudent ? currentStudent.name[0].toUpperCase() : '?'}
          </span>
          <span className="truncate">
            {currentStudent ? currentStudent.name : 'Select student'}
          </span>
        </button>
      </div>

      <StudentPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </aside>
  )
}
