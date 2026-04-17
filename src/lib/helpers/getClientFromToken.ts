import { NextRequest } from 'next/server'
import { verifyToken, TokenPayload } from '@/lib/auth/generateToken'

/**
 * Reads and verifies the JWT from:
 *   1. Authorization: Bearer <token> header
 *   2. vm_token cookie
 *
 * Returns the decoded { id, email, role } payload or null if invalid/missing.
 *
 * Usage in API routes:
 *   const user = getClientFromToken(request)
 *   if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
 *   if (user.role !== 'cliente') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 */
export function getClientFromToken(req: NextRequest): TokenPayload | null {
  try {
    const authHeader = req.headers.get('authorization')
    const cookieToken = req.cookies.get('vm_token')?.value

    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : cookieToken

    if (!rawToken) return null

    return verifyToken(rawToken)
  } catch {
    return null
  }
}
