import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import PlanAsignado from '@/lib/models/PlanAsignado'
import Plan from '@/lib/models/Plan'
import Project from '@/lib/models/Project'
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

function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    return verifyToken(auth.split(' ')[1])
  } catch {
    return null
  }
}

// GET /api/proyectos/[id]/plan
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    await dbConnect()
    const { id } = await params

    // Verificar que el proyecto existe y que el user puede acceder
    const project = await Project.findById(id).lean()
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 })

    const isAdmin = user.role === 'admin' || user.role === 'superadmin'
    if (!isAdmin && String((project as { clientId: unknown }).clientId) !== user.id) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }

    const planAsignado = await PlanAsignado.findOne({ proyectoId: id })
      .populate('planId')
      .lean()

    if (!planAsignado) {
      return NextResponse.json({ planAsignado: null }, { status: 200 })
    }

    return NextResponse.json({ planAsignado }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/proyectos/[id]/plan]', error)
    return NextResponse.json({ error: 'Error al obtener el plan.' }, { status: 500 })
  }
}

// POST /api/proyectos/[id]/plan — asignar plan (solo admin)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    await dbConnect()
    const { id } = await params
    const body = await req.json()

    const { planId, precioAcordado, mantenimientoActivo, mantenimientoPrecioAcordado, estadoPago, montoPagado, fechaUltimoPago, notasPago } = body

    if (!planId || precioAcordado === undefined) {
      return NextResponse.json({ error: 'planId y precioAcordado son requeridos.' }, { status: 400 })
    }

    const project = await Project.findById(id)
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 })

    const plan = await Plan.findById(planId)
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado.' }, { status: 404 })

    // Si ya existe un plan asignado, guardamos historial de cambio
    const existente = await PlanAsignado.findOne({ proyectoId: id })

    if (existente) {
      // Guardar historial de cambio de plan
      existente.historialCambios.push({
        fecha: new Date(),
        planAnterior: existente.planId,
        planNuevo: plan._id,
        modificadoPor: new mongoose.Types.ObjectId(admin.id),
        nota: 'Plan reemplazado',
      })
      existente.planId = plan._id
      existente.precioAcordado = precioAcordado
      existente.mantenimientoActivo = plan.mantenimientoObligatorio ? true : (mantenimientoActivo ?? false)
      existente.mantenimientoPrecioAcordado = mantenimientoPrecioAcordado ?? null
      existente.estadoPago = estadoPago ?? 'pendiente'
      existente.montoPagado = montoPagado ?? 0
      existente.fechaUltimoPago = fechaUltimoPago ? new Date(fechaUltimoPago) : null
      existente.notasPago = notasPago ?? null
      await existente.save()
      const populated = await PlanAsignado.findById(existente._id).populate('planId').lean()
      return NextResponse.json({ planAsignado: populated }, { status: 200 })
    }

    // Calcular estado de pago si se paga el total
    let estadoPagoFinal = estadoPago ?? 'pendiente'
    let montoPagadoFinal = montoPagado ?? 0
    if (estadoPagoFinal === 'pago_total') {
      montoPagadoFinal = precioAcordado
    }
    if (montoPagadoFinal >= precioAcordado && precioAcordado > 0) {
      estadoPagoFinal = 'pago_total'
    }

    const planAsignado = await PlanAsignado.create({
      proyectoId: id,
      planId: plan._id,
      precioAcordado,
      mantenimientoActivo: plan.mantenimientoObligatorio ? true : (mantenimientoActivo ?? false),
      mantenimientoPrecioAcordado: mantenimientoPrecioAcordado ?? null,
      fechaAsignacion: new Date(),
      estadoPago: estadoPagoFinal,
      montoPagado: montoPagadoFinal,
      fechaUltimoPago: fechaUltimoPago ? new Date(fechaUltimoPago) : null,
      notasPago: notasPago ?? null,
      historialPagos: [],
      historialCambios: [],
    })

    const populated = await PlanAsignado.findById(planAsignado._id).populate('planId').lean()
    return NextResponse.json({ planAsignado: populated }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/proyectos/[id]/plan]', error)
    return NextResponse.json({ error: 'Error al asignar el plan.' }, { status: 500 })
  }
}

// PUT /api/proyectos/[id]/plan — actualizar plan asignado (solo admin)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    await dbConnect()
    const { id } = await params
    const body = await req.json()

    const planAsignado = await PlanAsignado.findOne({ proyectoId: id })
    if (!planAsignado) return NextResponse.json({ error: 'Plan no asignado a este proyecto.' }, { status: 404 })

    const { precioAcordado, mantenimientoActivo, mantenimientoPrecioAcordado, estadoPago, montoPagado, fechaUltimoPago, notasPago } = body

    if (precioAcordado !== undefined) planAsignado.precioAcordado = precioAcordado
    if (mantenimientoActivo !== undefined) planAsignado.mantenimientoActivo = mantenimientoActivo
    if (mantenimientoPrecioAcordado !== undefined) planAsignado.mantenimientoPrecioAcordado = mantenimientoPrecioAcordado
    if (notasPago !== undefined) planAsignado.notasPago = notasPago
    if (montoPagado !== undefined) {
      planAsignado.montoPagado = Math.max(0, montoPagado)
    }
    if (fechaUltimoPago !== undefined) planAsignado.fechaUltimoPago = fechaUltimoPago ? new Date(fechaUltimoPago) : null
    if (estadoPago !== undefined) planAsignado.estadoPago = estadoPago

    // Auto-calcular estado si montoPagado >= precioAcordado
    if (planAsignado.montoPagado >= planAsignado.precioAcordado && planAsignado.precioAcordado > 0) {
      planAsignado.estadoPago = 'pago_total'
    }

    await planAsignado.save()
    const populated = await PlanAsignado.findById(planAsignado._id).populate('planId').lean()
    return NextResponse.json({ planAsignado: populated }, { status: 200 })
  } catch (error) {
    console.error('[PUT /api/proyectos/[id]/plan]', error)
    return NextResponse.json({ error: 'Error al actualizar el plan.' }, { status: 500 })
  }
}
