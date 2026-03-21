import { cookies } from 'next/headers'

export async function getAuthCookie() {
  const store = await cookies()
  return store.get('jp_auth')?.value
}

export async function getStudentIdCookie(): Promise<number | null> {
  const store = await cookies()
  const val = store.get('jp_student_id')?.value
  return val ? parseInt(val, 10) : null
}
