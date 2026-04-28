import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import PlanAsignado from '@/lib/models/PlanAsignado'
import Project from '@/lib/models/Project'
import Notification from '@/lib/models/Notification'
import { verifyToken } from '@/lib/auth/generateToken'

function getAdmin(req: NextRequest) {
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

// POST /api/proyectos/[id]/plan/registrar-pago
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    await dbConnect()
    const { id } = await params
    const body = await req.json()
    const { monto, fecha, nota } = body

    if (!monto || monto <= 0) {
      return NextResponse.json({ error: 'El monto del pago debe ser mayor a 0.' }, { status: 400 })
    }

    const planAsignado = await PlanAsignado.findOne({ proyectoId: id })
    if (!planAsignado) return NextResponse.json({ error: 'Plan no asignado a este proyecto.' }, { status: 404 })

    const project = await Project.findById(id).select('clientId name').lean() as { clientId: mongoose.Types.ObjectId; name: string } | null
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 })

    // Registrar el pago en el historial
    planAsignado.historialPagos.push({
      monto,
      fecha: fecha ? new Date(fecha) : new Date(),
      nota: nota ?? null,
      registradoPor: new mongoose.Types.ObjectId(admin.id),
    })

    // Actualizar monto pagado y estado
    planAsignado.montoPagado = Math.min(
      planAsignado.montoPagado + monto,
      planAsignado.precioAcordado
    )
    planAsignado.fechaUltimoPago = fecha ? new Date(fecha) : new Date()

    // Auto-calcular estado
    if (planAsignado.montoPagado >= planAsignado.precioAcordado) {
      planAsignado.estadoPago = 'pago_total'
    } else if (planAsignado.montoPagado > 0) {
      planAsignado.estadoPago = 'pago_parcial'
    }

    await planAsignado.save()

    // Notificación interna al cliente
    const estadoLabel: Record<string, string> = {
      pendiente: 'Pendiente',
      pago_parcial: 'Pago parcial',
      pago_total: 'Pago completo ✓',
    }
    try {
      await Notification.create({
        userId: project.clientId,
        type: 'factura',
        title: 'Pago registrado en tu proyecto',
        message: `Se registró un pago de $${monto.toLocaleString('es-AR')} en tu proyecto "${project.name}". Estado actual: ${estadoLabel[planAsignado.estadoPago] ?? planAsignado.estadoPago}.`,
        link: '/dashboard/planes',
        read: false,
      })
    } catch (notifError) {
      console.error('[registrar-pago] Error al crear notificación:', notifError)
    }

    const populated = await PlanAsignado.findById(planAsignado._id).populate('planId').lean()
    return NextResponse.json({ planAsignado: populated }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/proyectos/[id]/plan/registrar-pago]', error)
    return NextResponse.json({ error: 'Error al registrar el pago.' }, { status: 500 })
  }
}
