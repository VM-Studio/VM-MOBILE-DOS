import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Mantenimiento from '@/lib/models/Mantenimiento'
import Project from '@/lib/models/Project'
import PlanAsignado from '@/lib/models/PlanAsignado'
import Notification from '@/lib/models/Notification'
import { verifyToken } from '@/lib/auth/generateToken'

// ── helpers ──────────────────────────────────────────────────────────────────

function addOneMonth(date: Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1)
  return d
}

function authHeader(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try { return verifyToken(auth.split(' ')[1]) } catch { return null }
}

// ── GET /api/proyectos/[id]/mantenimiento ────────────────────────────────────
// Cliente (dueño) o admin pueden consultar
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const payload = authHeader(req)
  if (!payload) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  await dbConnect()

  const project = await Project.findById(id).lean()
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 })

  const isAdmin = payload.role === 'admin' || payload.role === 'superadmin'
  const isOwner = String(project.clientId) === payload.id

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const mantenimiento = await Mantenimiento.findOne({ proyectoId: id })
    .populate('aprobadoPor', 'name email')
    .lean()

  return NextResponse.json({
    projectStatus: project.status,
    mantenimiento: mantenimiento ?? null,
  })
}

// ── POST /api/proyectos/[id]/mantenimiento ───────────────────────────────────
// Cliente solicita mantenimiento (proyecto debe estar completado)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const payload = authHeader(req)
  if (!payload) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  await dbConnect()

  const project = await Project.findById(id).lean()
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 })

  const isAdmin = payload.role === 'admin' || payload.role === 'superadmin'
  const isOwner = String(project.clientId) === payload.id

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  if (project.status !== 'completado') {
    return NextResponse.json(
      { error: 'El proyecto debe estar completado para solicitar mantenimiento.' },
      { status: 400 }
    )
  }

  // Verificar que no exista uno activo/pendiente
  const existing = await Mantenimiento.findOne({
    proyectoId: id,
    estado: { $in: ['pendiente_aprobacion', 'activo', 'pausado'] },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe un mantenimiento activo o pendiente para este proyecto.' },
      { status: 409 }
    )
  }

  const body = await req.json()
  const { tipo, notaCliente } = body

  if (!tipo || !['mensual_recurrente', 'puntual'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo de mantenimiento inválido.' }, { status: 400 })
  }

  // Obtener precio del plan asignado
  const planAsignado = await PlanAsignado.findOne({ proyectoId: id })
    .populate('planId', 'mantenimientoPrecio')
    .lean()

  const precioMensual =
    planAsignado?.mantenimientoPrecioAcordado ??
    (planAsignado?.planId as { mantenimientoPrecio?: number } | null)?.mantenimientoPrecio ??
    0

  const mantenimiento = await Mantenimiento.create({
    proyectoId: id,
    planAsignadoId: planAsignado?._id ?? null,
    clienteId: project.clientId,
    tipo,
    estado: 'pendiente_aprobacion',
    precioMensual,
    notaCliente: notaCliente || null,
  })

  // Notificación al equipo admin (notificamos al cliente también con el estado)
  // No tenemos userId admin fijo — generamos notif al cliente confirmando la solicitud
  await Notification.create({
    userId: project.clientId,
    type: 'general',
    title: 'Solicitud de mantenimiento enviada',
    message: `Tu solicitud de mantenimiento (${tipo === 'mensual_recurrente' ? 'mensual recurrente' : 'puntual'}) fue recibida y está siendo revisada por el equipo.`,
    link: '/dashboard/mantenimiento',
  })

  return NextResponse.json({ mantenimiento }, { status: 201 })
}

// ── PATCH /api/proyectos/[id]/mantenimiento ──────────────────────────────────
// Admin: aprobar, pausar, cancelar — o cliente: cancelar el suyo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const payload = authHeader(req)
  if (!payload) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  await dbConnect()

  const project = await Project.findById(id).lean()
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 })

  const isAdmin = payload.role === 'admin' || payload.role === 'superadmin'
  const isOwner = String(project.clientId) === payload.id

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const body = await req.json()
  const { accion, notaAdmin, motivoCancelacion } = body
  // accion: 'aprobar' | 'pausar' | 'reanudar' | 'cancelar' (admin)
  //         'cancelar' (cliente)

  const mantenimiento = await Mantenimiento.findOne({ proyectoId: id })
  if (!mantenimiento) {
    return NextResponse.json({ error: 'No se encontró mantenimiento para este proyecto.' }, { status: 404 })
  }

  if (!isAdmin && accion !== 'cancelar') {
    return NextResponse.json({ error: 'Solo el administrador puede realizar esta acción.' }, { status: 403 })
  }

  switch (accion) {
    case 'aprobar': {
      if (!isAdmin) return NextResponse.json({ error: 'Solo admin puede aprobar.' }, { status: 403 })
      if (mantenimiento.estado !== 'pendiente_aprobacion') {
        return NextResponse.json({ error: 'Solo se puede aprobar una solicitud pendiente.' }, { status: 400 })
      }
      const ahora = new Date()
      mantenimiento.estado = 'activo'
      mantenimiento.fechaAprobacion = ahora
      mantenimiento.aprobadoPor = payload.id as unknown as import('mongoose').Types.ObjectId
      mantenimiento.fechaInicio = ahora
      mantenimiento.fechaProximoCobro = addOneMonth(ahora)
      if (notaAdmin) mantenimiento.notaAdmin = notaAdmin
      // Actualizar PlanAsignado si existe
      if (mantenimiento.planAsignadoId) {
        await PlanAsignado.findByIdAndUpdate(mantenimiento.planAsignadoId, {
          mantenimientoActivo: true,
        })
      }
      // Notificación al cliente
      await Notification.create({
        userId: project.clientId,
        type: 'general',
        title: '¡Mantenimiento aprobado!',
        message: `Tu servicio de mantenimiento fue aprobado y está activo. El próximo cobro será el ${mantenimiento.fechaProximoCobro.toLocaleDateString('es-AR')}.`,
        link: '/dashboard/mantenimiento',
      })
      break
    }
    case 'pausar': {
      if (!isAdmin) return NextResponse.json({ error: 'Solo admin puede pausar.' }, { status: 403 })
      mantenimiento.estado = 'pausado'
      if (notaAdmin) mantenimiento.notaAdmin = notaAdmin
      await Notification.create({
        userId: project.clientId,
        type: 'general',
        title: 'Mantenimiento pausado',
        message: 'Tu servicio de mantenimiento fue pausado temporalmente. Contactá al equipo para más información.',
        link: '/dashboard/mantenimiento',
      })
      break
    }
    case 'reanudar': {
      if (!isAdmin) return NextResponse.json({ error: 'Solo admin puede reanudar.' }, { status: 403 })
      mantenimiento.estado = 'activo'
      if (!mantenimiento.fechaProximoCobro) {
        mantenimiento.fechaProximoCobro = addOneMonth(new Date())
      }
      if (notaAdmin) mantenimiento.notaAdmin = notaAdmin
      await Notification.create({
        userId: project.clientId,
        type: 'general',
        title: 'Mantenimiento reanudado',
        message: 'Tu servicio de mantenimiento fue reanudado.',
        link: '/dashboard/mantenimiento',
      })
      break
    }
    case 'cancelar': {
      mantenimiento.estado = 'cancelado'
      mantenimiento.fechaCancelacion = new Date()
      mantenimiento.motivoCancelacion = motivoCancelacion || null
      if (isAdmin && notaAdmin) mantenimiento.notaAdmin = notaAdmin
      // Actualizar PlanAsignado
      if (mantenimiento.planAsignadoId) {
        await PlanAsignado.findByIdAndUpdate(mantenimiento.planAsignadoId, {
          mantenimientoActivo: false,
        })
      }
      if (!isAdmin) {
        // Notif al cliente
        await Notification.create({
          userId: project.clientId,
          type: 'general',
          title: 'Mantenimiento cancelado',
          message: 'Tu solicitud de mantenimiento fue cancelada.',
          link: '/dashboard/mantenimiento',
        })
      }
      break
    }
    default:
      return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 })
  }

  await mantenimiento.save()
  return NextResponse.json({ mantenimiento })
}
