import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { students } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AppProvider } from '@/app/context'
import { Sidebar } from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // SSR restore: read jp_student_id cookie to avoid flash of empty state
  const cookieStore = await cookies()
  const studentIdStr = cookieStore.get('jp_student_id')?.value
  let initialStudent = null
  if (studentIdStr) {
    const id = parseInt(studentIdStr, 10)
    const rows = await db.select().from(students).where(eq(students.id, id)).limit(1)
    initialStudent = rows[0] ?? null
  }

  const initialDomain = (initialStudent?.home_domain ?? initialStudent?.domain ?? 'japanese') as string

  return (
    // Set data-domain server-side so domain CSS variables are correct on first render (no flash)
    <div data-domain={initialDomain}>
      <AppProvider initialStudent={initialStudent}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </AppProvider>
    </div>
  )
}
