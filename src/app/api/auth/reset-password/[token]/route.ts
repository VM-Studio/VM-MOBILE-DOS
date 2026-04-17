import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect()
    const { token } = await params
    const { password } = await req.json()

    if (!password || password.length < 8) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      )
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'El link expiró o es inválido. Solicitá uno nuevo.' },
        { status: 400 }
      )
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente.' }, { status: 200 })
  } catch (error) {
    console.error('[RESET-PASSWORD]', error)
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 })
  }
}
