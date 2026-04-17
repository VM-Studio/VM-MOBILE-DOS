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
    console.error('[LOGIN ERROR]', error)

    if (!(error instanceof Error)) {
      return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 })
    }

    const msg = error.message ?? ''
    const name = (error as { name?: string; code?: number | string }).name ?? ''
    const code = (error as { name?: string; code?: number | string }).code

    const isMissingUri = msg.includes('MONGODB_URI')

    const isNetworkError =
      name === 'MongooseServerSelectionError' ||
      name === 'MongoServerSelectionError' ||
      msg.includes('Could not connect') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('timed out') ||
      msg.includes('querySrv') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('failed to connect') ||
      msg.includes('connection refused')

    // MongoDB Atlas: IP no está en el access list o credenciales incorrectas
    const isAuthError =
      name === 'MongoServerError' ||
      msg.includes('Authentication failed') ||
      msg.includes('bad auth') ||
      msg.includes('not authorized') ||
      msg.includes('Unauthorized') ||
      code === 18 || // MongoDB auth error code
      code === 13   // MongoDB unauthorized code

    if (isMissingUri) {
      console.error('[LOGIN] MONGODB_URI no está configurada en las variables de entorno')
      return NextResponse.json(
        { message: 'Error de configuración del servidor. Contactá al administrador.' },
        { status: 500 }
      )
    }

    if (isNetworkError) {
      console.error('[LOGIN] Error de red/conexión a MongoDB:', msg)
      return NextResponse.json(
        { message: 'No se pudo conectar a la base de datos. Reintentá en unos segundos.' },
        { status: 503 }
      )
    }

    if (isAuthError) {
      console.error('[LOGIN] Error de autenticación en MongoDB Atlas (verificá credenciales e IP access list):', msg)
      return NextResponse.json(
        { message: 'Error de configuración de la base de datos. Contactá al administrador.' },
        { status: 500 }
      )
    }

    console.error('[LOGIN] Error no clasificado:', name, msg)
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 })
  }
}
