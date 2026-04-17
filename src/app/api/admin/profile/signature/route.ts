import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'

// POST → guardar firma del admin
export async function POST(req: NextRequest) {
  try {
    const admin = getAdminFromToken(req)
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { signatureData } = await req.json()
    if (!signatureData)
      return NextResponse.json({ error: 'Firma requerida' }, { status: 400 })

    await dbConnect()

    await User.updateOne(
      { _id: admin.id },
      { signatureData, signatureUpdatedAt: new Date() }
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/admin/profile/signature]', err)
    return NextResponse.json({ error: 'Error al guardar firma' }, { status: 500 })
  }
}

// DELETE → eliminar firma del admin
export async function DELETE(req: NextRequest) {
  try {
    const admin = getAdminFromToken(req)
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    await dbConnect()

    await User.updateOne(
      { _id: admin.id },
      { signatureData: null, signatureUpdatedAt: null }
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/profile/signature]', err)
    return NextResponse.json({ error: 'Error al eliminar firma' }, { status: 500 })
  }
}
