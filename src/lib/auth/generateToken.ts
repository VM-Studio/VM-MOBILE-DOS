import jwt from 'jsonwebtoken'
import type { UserRole } from '@/lib/models/User'

const JWT_SECRET = process.env.JWT_SECRET ?? 'vm_studio_secret_key_2026'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

export interface TokenPayload {
  id: string
  email: string
  role: UserRole
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}
