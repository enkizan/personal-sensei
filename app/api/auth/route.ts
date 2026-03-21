import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { passcode } = await req.json()
  if (passcode !== process.env.PASSCODE) {
    return NextResponse.json({ error: 'incorrect' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('jp_auth', 'granted', {
    httpOnly: true, sameSite: 'strict', maxAge: 604800, path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
