'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useApp } from '@/app/context'
import { DomainPicker } from './domain-picker'
import { StudentPicker } from './student-picker'
import { Button } from '@/components/ui/button'
import { DOMAINS } from '@/lib/domains'
import { Sun, Moon, LayoutDashboard, BookOpen, MessageCircle, BarChart2, Settings } from 'lucide-react'
import { useState } from 'react'

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
    <aside className="w-56 shrink-0 flex flex-col border-r bg-card h-screen">
      {/* Brand + domain picker */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-2xl font-bold text-primary">{DOMAINS[domain].icon}</span>
          <span className="font-semibold text-sm">Learning</span>
        </div>
        <DomainPicker />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant={pathname.startsWith(href) ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2 h-9 px-3"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Footer: theme + student */}
      <div className="p-3 border-t space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-2 h-9 px-3"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2 h-9 px-3 text-xs"
          onClick={() => setPickerOpen(true)}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {currentStudent ? currentStudent.name[0] : '?'}
          </span>
          {currentStudent ? currentStudent.name : 'Select student'}
        </Button>
      </div>

      <StudentPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </aside>
  )
}
