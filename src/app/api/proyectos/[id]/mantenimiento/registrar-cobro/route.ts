import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Mantenimiento from '@/lib/models/Mantenimiento'
import Notification from '@/lib/models/Notification'
import { verifyToken } from '@/lib/auth/generateToken'

function addOneMonth(date: Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1)
  return d
}

// POST /api/proyectos/[id]/mantenimiento/registrar-cobro — solo admin
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  let payload: { id: string; role: string }
  try {
    payload = verifyToken(auth.split(' ')[1])
  } catch {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
  }
  if (payload.role !== 'admin' && payload.role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo admins pueden registrar cobros.' }, { status: 403 })
  }

  await dbConnect()

  const mantenimiento = await Mantenimiento.findOne({ proyectoId: id })
  if (!mantenimiento) {
    return NextResponse.json({ error: 'No hay mantenimiento para este proyecto.' }, { status: 404 })
  }
  if (mantenimiento.estado !== 'activo') {
    return NextResponse.json({ error: 'El mantenimiento no está activo.' }, { status: 400 })
  }

  const body = await req.json()
  const { nota, estadoCobro = 'cobrado' } = body

  const cobro = {
    fecha: new Date(),
    monto: mantenimiento.precioMensual,
    estado: estadoCobro as 'cobrado' | 'pendiente' | 'fallido',
    nota: nota || null,
    registradoPor: payload.id,
  }

  mantenimiento.historialCobros.push(cobro as never)
  mantenimiento.cobrosRealizados += 1

  if (estadoCobro === 'cobrado') {
    // Avanzar próximo cobro 1 mes
    const base = mantenimiento.fechaProximoCobro ?? new Date()
    mantenimiento.fechaProximoCobro = addOneMonth(base)
  }

  // Si es puntual → cancelar automáticamente después del primer cobro
  if (mantenimiento.tipo === 'puntual' && estadoCobro === 'cobrado') {
    mantenimiento.estado = 'cancelado'
    mantenimiento.fechaCancelacion = new Date()
    mantenimiento.motivoCancelacion = 'Mantenimiento puntual completado automáticamente.'
  }

  await mantenimiento.save()

  // Notificación al cliente
  const proximoMsg = mantenimiento.tipo === 'puntual'
    ? 'Tu mantenimiento puntual fue procesado y completado.'
    : `Tu cuota de mantenimiento fue procesada. Próximo cobro: ${mantenimiento.fechaProximoCobro?.toLocaleDateString('es-AR')}.`

  await Notification.create({
    userId: mantenimiento.clienteId,
    type: 'factura',
    title: 'Cobro de mantenimiento registrado',
    message: `Se registró un cobro de $${mantenimiento.precioMensual.toLocaleString('es-AR')} ARS. ${proximoMsg}`,
    link: '/dashboard/mantenimiento',
  })

  return NextResponse.json({ mantenimiento }, { status: 200 })
}
