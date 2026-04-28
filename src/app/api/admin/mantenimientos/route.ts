import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Mantenimiento from '@/lib/models/Mantenimiento'
import { verifyToken } from '@/lib/auth/generateToken'

// GET /api/admin/mantenimientos — lista todos los mantenimientos con filtros
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  try {
    const payload = verifyToken(auth.split(' ')[1])
    if (payload.role !== 'admin' && payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
  }

  await dbConnect()

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado') // activo|pausado|pendiente_aprobacion|cancelado|all

  const query: Record<string, unknown> = {}
  if (estado && estado !== 'all') {
    query.estado = estado
  } else if (!estado) {
    // Por defecto: activos y pendientes
    query.estado = { $in: ['activo', 'pendiente_aprobacion', 'pausado'] }
  }

  const mantenimientos = await Mantenimiento.find(query)
    .populate('proyectoId', 'name clientId status')
    .populate('clienteId', 'name email company')
    .populate('aprobadoPor', 'name')
    .sort({ fechaProximoCobro: 1, fechaSolicitud: -1 })
    .lean()

  // Calcular próximos cobros en los siguientes 7 días
  const ahora = new Date()
  const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)
  const proximosCobros = mantenimientos.filter(
    (m) =>
      m.estado === 'activo' &&
      m.fechaProximoCobro &&
      new Date(m.fechaProximoCobro) <= en7dias
  )

  return NextResponse.json({
    mantenimientos,
    total: mantenimientos.length,
    proximosCobros: proximosCobros.length,
  })
}
