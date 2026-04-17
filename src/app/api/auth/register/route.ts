import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/auth/sendEmail'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const { name, email, password, company } = await req.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nombre, email y contraseña son requeridos.' },
        { status: 400 }
      )
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json(
        { message: 'Ya existe una cuenta con ese email.' },
        { status: 409 }
      )
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const user = await User.create({
      name,
      email,
      password,
      company,
      verificationToken,
    })

    // Send emails (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(user.email, verificationToken).catch(console.error)
    sendWelcomeEmail(user.email, user.name).catch(console.error)

    const { password: _pw, verificationToken: _vt, ...safeUser } = user.toObject()
    void _pw; void _vt

    return NextResponse.json(
      { message: 'Cuenta creada. Revisá tu email para verificar tu cuenta.', user: safeUser },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTER ERROR]', error)

    const err = error as Error & { name?: string }
    const msg = err.message ?? ''
    const name = err.name ?? ''

    const isMissingUri = msg.includes('MONGODB_URI')
    const isNetworkError =
      msg.includes('Could not connect') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('timed out') ||
      msg.includes('querySrv') ||
      msg.includes('ENOTFOUND') ||
      name === 'MongooseServerSelectionError'

    if (isMissingUri) {
      return NextResponse.json(
        { message: 'Error de configuración del servidor. Contactá al administrador.' },
        { status: 500 }
      )
    }
    if (isNetworkError) {
      return NextResponse.json(
        { message: 'No se pudo conectar a la base de datos. Reintentá en unos segundos.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 })
  }
}
