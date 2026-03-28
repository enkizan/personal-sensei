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

  // Build base from Host header — req.url uses the internal Docker hostname
  // (localhost:3000) which is unreachable from external devices on the LAN.
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost'
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  const base  = `${proto}://${host}`

  if (passcode !== process.env.PASSCODE) {
    if (isNativeForm) {
      return NextResponse.redirect(`${base}/passcode?error=1`)
    }
    return NextResponse.json({ error: 'incorrect' }, { status: 401 })
  }

  const res = isNativeForm
    ? NextResponse.redirect(`${base}/dashboard`, 303)
    : NextResponse.json({ ok: true })

  res.cookies.set('jp_auth', 'granted', {
    httpOnly: true, sameSite: 'lax', maxAge: 604800, path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
