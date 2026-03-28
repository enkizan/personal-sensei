import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const auth = req.cookies.get('jp_auth')?.value
  if (auth !== 'granted') {
    const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost'
    const proto = req.headers.get('x-forwarded-proto') ?? 'http'
    return NextResponse.redirect(`${proto}://${host}/passcode`)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!passcode|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
