import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import Project from '@/lib/models/Project'
import User from '@/lib/models/User'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'

// GET /api/debug/signature?invoiceId=xxx
// Muestra el estado completo para diagnosticar por qué no se activa awaitingSignature
export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  const { searchParams } = new URL(req.url)
  const invoiceId = searchParams.get('invoiceId')

  if (!invoiceId) {
    // Si no hay invoiceId, listar últimas 5 facturas con sus proyectos
    const invoices = await Invoice.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('number status invoiceType projectId clientId amount createdAt')
      .lean()

    const adminUsers = await User.find({
      role: { $in: ['admin', 'superadmin'] },
    }).select('name role signatureData signatureUpdatedAt').lean()

    return NextResponse.json({
      lastInvoices: invoices.map(i => ({
        _id: i._id,
        number: i.number,
        status: i.status,
        invoiceType: i.invoiceType,
        projectId: i.projectId,
        hasProjectId: !!i.projectId,
        amount: i.amount,
        createdAt: i.createdAt,
      })),
      admins: adminUsers.map(a => ({
        _id: a._id,
        name: a.name,
        role: a.role,
        hasSignature: !!a.signatureData,
        signatureUpdatedAt: a.signatureUpdatedAt,
      })),
    })
  }

  // Debug específico para un invoiceId
  const invoice = await Invoice.findById(invoiceId).lean()
  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' })

  let project = null
  if (invoice.projectId) {
    project = await Project.findById(invoice.projectId)
      .select('name status awaitingSignature closingSignature')
      .lean()
  }

  const adminUsers = await User.find({
    role: { $in: ['admin', 'superadmin'] },
  }).select('name role signatureData').lean()

  return NextResponse.json({
    invoice: {
      _id: invoice._id,
      number: invoice.number,
      status: invoice.status,
      invoiceType: invoice.invoiceType,
      projectId: invoice.projectId,
      hasProjectId: !!invoice.projectId,
      amount: invoice.amount,
    },
    project: project ? {
      _id: (project as { _id: unknown })._id,
      name: (project as { name: string }).name,
      status: (project as { status: string }).status,
      awaitingSignature: (project as { awaitingSignature: boolean }).awaitingSignature,
      closingSignature: (project as { closingSignature: unknown }).closingSignature,
    } : null,
    admins: adminUsers.map(a => ({
      name: a.name,
      role: a.role,
      hasSignature: !!a.signatureData,
    })),
    triggerWouldRun: {
      hasProjectId: !!invoice.projectId,
      isNotAnticipo: invoice.invoiceType !== 'anticipo',
      projectFound: !!project,
      notAlreadyAwaiting: project ? !(project as { awaitingSignature: boolean }).awaitingSignature : null,
      notAlreadySigned: project ? !(project as { closingSignature?: { signedAt?: unknown } }).closingSignature?.signedAt : null,
    }
  })
}

// POST /api/debug/signature?invoiceId=xxx
// Fuerza awaitingSignature=true en el proyecto de esa factura (para testing)
export async function POST(req: NextRequest) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  const { searchParams } = new URL(req.url)
  const invoiceId = searchParams.get('invoiceId')
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId requerido' })

  const invoice = await Invoice.findById(invoiceId).lean()
  if (!invoice || !invoice.projectId) return NextResponse.json({ error: 'Factura sin projectId' })

  const adminUser = await User.findOne({
    role: { $in: ['admin', 'superadmin'] },
    signatureData: { $exists: true, $ne: null },
  }).lean()

  await Project.updateOne(
    { _id: invoice.projectId },
    {
      awaitingSignature: true,
      'closingSignature.adminSignatureData': adminUser?.signatureData ?? null,
      'closingSignature.adminName': adminUser?.name ?? 'VM Studio',
      'closingSignature.signedByAdmin': adminUser?._id ?? null,
    }
  )

  return NextResponse.json({ success: true, projectId: invoice.projectId, adminFound: !!adminUser })
}
