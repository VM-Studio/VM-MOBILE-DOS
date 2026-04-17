import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { generateToken } from '@/lib/auth/generateToken'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email y contraseña son requeridos.' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { message: 'Credenciales incorrectas.' },
        { status: 401 }
      )
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Credenciales incorrectas.' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Tu cuenta fue desactivada. Contactá a soporte.' },
        { status: 403 }
      )
    }

    // Update lastLogin
    user.lastLogin = new Date()
    await user.save()

    const token = generateToken({
      id: String(user._id),
      email: user.email,
      role: user.role,
    })

    const { password: _pw, verificationToken: _vt, resetPasswordToken: _rt, ...safeUser } =
      user.toObject()
    void _pw; void _vt; void _rt

    const response = NextResponse.json({ token, user: safeUser }, { status: 200 })
    response.cookies.set('vm_token', token, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    })
    return response
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const name = (error as { name?: string }).name ?? 'UnknownError'
    console.error('[LOGIN ERROR]', name, msg, error)

    // Sin URI configurada en Vercel
    if (msg.includes('MONGODB_URI')) {
      return NextResponse.json(
        { message: 'MONGODB_URI no está configurada en Vercel. Agregala en Settings → Environment Variables.' },
        { status: 500 }
      )
    }

    // No puede llegar al cluster (timeout, ENOTFOUND, ECONNREFUSED, DNS)
    if (
      name === 'MongooseServerSelectionError' ||
      name === 'MongoServerSelectionError' ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('timed out') ||
      msg.includes('querySrv') ||
      msg.includes('failed to connect')
    ) {
      return NextResponse.json(
        { message: `No se puede conectar a MongoDB Atlas. Verificá: 1) Network Access → 0.0.0.0/0. 2) El cluster no está pausado. Error: ${msg}` },
        { status: 503 }
      )
    }

    // Credenciales incorrectas en la URI
    if (
      msg.includes('Authentication failed') ||
      msg.includes('bad auth') ||
      msg.includes('not authorized') ||
      (error as { code?: number }).code === 18
    ) {
      return NextResponse.json(
        { message: `Credenciales de MongoDB incorrectas en MONGODB_URI. Verificá usuario/contraseña en Atlas. Error: ${msg}` },
        { status: 500 }
      )
    }

    // Cualquier otro error — mostrar detalle real para diagnosticar
    return NextResponse.json(
      { message: `Error: ${name} — ${msg}` },
      { status: 500 }
    )
  }
}
