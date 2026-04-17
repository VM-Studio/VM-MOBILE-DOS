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
    console.error('[LOGIN]', error)
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes('Could not connect') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timed out') ||
        error.name === 'MongooseServerSelectionError')
    return NextResponse.json(
      { message: isNetworkError ? 'No se pudo conectar a la base de datos. Reintentá en unos segundos.' : 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
