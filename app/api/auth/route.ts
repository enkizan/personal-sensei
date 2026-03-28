import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Support both JSON (fetch) and form-encoded (native form POST)
  const contentType = req.headers.get('content-type') ?? ''
  let passcode: string
  if (contentType.includes('application/json')) {
    passcode = (await req.json()).passcode
  } else {
    const form = await req.formData()
    passcode = form.get('passcode') as string
  }

  const isNativeForm = contentType.includes('application/x-www-form-urlencoded')

  if (passcode !== process.env.PASSCODE) {
    if (isNativeForm) {
      return NextResponse.redirect(new URL('/passcode?error=1', req.url))
    }
    return NextResponse.json({ error: 'incorrect' }, { status: 401 })
  }

  const res = isNativeForm
    ? NextResponse.redirect(new URL('/dashboard', req.url), 303)
    : NextResponse.json({ ok: true })

  res.cookies.set('jp_auth', 'granted', {
    httpOnly: true, sameSite: 'lax', maxAge: 604800, path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
