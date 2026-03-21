import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('jp_auth')?.value
  if (auth !== 'granted') {
    return NextResponse.redirect(new URL('/passcode', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!passcode|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
