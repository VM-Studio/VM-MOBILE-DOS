import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/generateToken'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    await dbConnect()
    const user = await User.findById(decoded.id)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires')
      .lean()

    if (!user || !user.isActive) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch {
    return NextResponse.json({ message: 'Token inválido o expirado.' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    await dbConnect()

    const body = await req.json()
    const { currentPassword, newPassword, name, phone, company, position, website, address } = body

    const user = await User.findById(decoded.id)
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })

    // Password change
    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: 'Ingresá tu contraseña actual.' }, { status: 400 })
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta.' }, { status: 400 })
      user.password = await bcrypt.hash(newPassword, 10)
    }

    // Profile fields update
    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone
    if (company !== undefined) user.company = company
    if (position !== undefined) user.position = position
    if (website !== undefined) user.website = website
    if (address !== undefined) user.address = address

    await user.save()
    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el perfil.' }, { status: 500 })
  }
}
