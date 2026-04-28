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

// GET /api/planes — lista todos los planes activos (o todos si admin)
export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all') === 'true'

    const auth = req.headers.get('authorization')
    let isAdminUser = false
    if (auth?.startsWith('Bearer ')) {
      try {
        const p = verifyToken(auth.split(' ')[1])
        isAdminUser = p.role === 'admin' || p.role === 'superadmin'
      } catch { /* public */ }
    }

    const filter = (all && isAdminUser) ? {} : { activo: true }
    const planes = await Plan.find(filter).sort({ orden: 1, createdAt: 1 }).lean()
    return NextResponse.json({ planes }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/planes]', error)
    return NextResponse.json({ error: 'Error al obtener planes.' }, { status: 500 })
  }
}

// POST /api/planes — crear plan (solo admin)
export async function POST(req: NextRequest) {
  const admin = isAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    await dbConnect()
    const body = await req.json()
    const { nombre, descripcion, precio, tipoPago, mantenimientoPrecio, mantenimientoObligatorio, incluye, activo, orden } = body

    if (!nombre || !descripcion || precio === undefined) {
      return NextResponse.json({ error: 'nombre, descripcion y precio son requeridos.' }, { status: 400 })
    }

    const plan = await Plan.create({
      nombre,
      descripcion,
      precio,
      tipoPago: tipoPago ?? 'pago_unico',
      mantenimientoPrecio: mantenimientoPrecio ?? null,
      mantenimientoObligatorio: mantenimientoObligatorio ?? false,
      incluye: incluye ?? [],
      activo: activo !== undefined ? activo : true,
      orden: orden ?? 0,
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/planes]', error)
    return NextResponse.json({ error: 'Error al crear el plan.' }, { status: 500 })
  }
}
