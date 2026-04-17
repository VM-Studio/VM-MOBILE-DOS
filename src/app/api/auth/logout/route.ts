import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Sesión cerrada.' }, { status: 200 })
  response.cookies.set('vm_token', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  })
  return response
}
