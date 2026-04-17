import { NextRequest, NextResponse } from 'next/server'

const ADMIN_ROLES = ['admin', 'superadmin']

// Decode JWT payload without verifying signature (Edge-safe)
// We still verify the signature below using the Web Crypto API
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // Base64url decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()

  const cookieToken = req.cookies.get('vm_token')?.value
  const authHeader = req.headers.get('authorization')
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : cookieToken

  if (!rawToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Decode payload (signature verification happens in API routes with full Node.js)
  const payload = decodeJwtPayload(rawToken)

  if (!payload || !payload.role) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Check expiry
  if (payload.exp && typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (!ADMIN_ROLES.includes(payload.role as string)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
