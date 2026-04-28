import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Plan from '@/lib/models/Plan'
import { verifyToken } from '@/lib/auth/generateToken'

function isAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const payload = verifyToken(auth.split(' ')[1])
    if (payload.role !== 'admin' && payload.role !== 'superadmin') return null
    return payload
  } catch {
    return null
  }
}

// GET /api/planes/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const plan = await Plan.findById(id).lean()
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado.' }, { status: 404 })
    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/planes/[id]]', error)
    return NextResponse.json({ error: 'Error al obtener el plan.' }, { status: 500 })
  }
}

// PUT /api/planes/[id] — editar plan (solo admin)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = isAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    await dbConnect()
    const { id } = await params
    const body = await req.json()
    const { nombre, descripcion, precio, tipoPago, mantenimientoPrecio, mantenimientoObligatorio, incluye, activo, orden } = body

    const plan = await Plan.findByIdAndUpdate(
      id,
      { nombre, descripcion, precio, tipoPago, mantenimientoPrecio, mantenimientoObligatorio, incluye, activo, orden },
      { new: true, runValidators: true }
    )
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado.' }, { status: 404 })
    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    console.error('[PUT /api/planes/[id]]', error)
    return NextResponse.json({ error: 'Error al actualizar el plan.' }, { status: 500 })
  }
}

// PATCH /api/planes/[id] — toggle activo (solo admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = isAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    await dbConnect()
    const { id } = await params
    const body = await req.json()

    const plan = await Plan.findById(id)
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado.' }, { status: 404 })

    if ('activo' in body) {
      plan.activo = body.activo
    } else {
      plan.activo = !plan.activo
    }

    if ('orden' in body) plan.orden = body.orden

    await plan.save()
    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    console.error('[PATCH /api/planes/[id]]', error)
    return NextResponse.json({ error: 'Error al actualizar el plan.' }, { status: 500 })
  }
}
