import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { sendPasswordResetEmail } from '@/lib/auth/sendEmail'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ message: 'El email es requerido.' }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    // Always respond 200 to avoid user enumeration
    if (!user) {
      return NextResponse.json(
        { message: 'Si el email existe, recibirás un link para restablecer tu contraseña.' },
        { status: 200 }
      )
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save()

    await sendPasswordResetEmail(user.email, rawToken)

    return NextResponse.json(
      { message: 'Si el email existe, recibirás un link para restablecer tu contraseña.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[FORGOT-PASSWORD]', error)
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 })
  }
}
