import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function getAdminFromToken(req: NextRequest): TokenPayload | null {
  try {
    const authHeader = req.headers.get('authorization');
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies.get('vm_token')?.value;
    }

    if (!token) return null;

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    if (payload.role !== 'admin' && payload.role !== 'superadmin') return null;

    return payload;
  } catch {
    return null;
  }
}
