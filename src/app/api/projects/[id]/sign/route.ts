import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Project from '@/lib/models/Project'
import User from '@/lib/models/User'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { generateClosingCertificatePDF } from '@/lib/pdf/generators/generateClosingCertificatePDF'
import { sendNotification } from '@/lib/helpers/sendNotification'
import { sendEmailToAdmins } from '@/lib/helpers/sendEmailToAdmins'
import { emailAdminProyectoCerrado } from '@/lib/emails/templates'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getClientFromToken(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const { signatureData } = await req.json()

    if (!signatureData)
      return NextResponse.json({ error: 'Firma requerida' }, { status: 400 })

    await dbConnect()

    const project = await Project.findById(id).populate('clientId', 'name email company')
    if (!project)
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    // Verificar ownership
    const clientDoc = project.clientId as unknown as {
      _id: { toString(): string }
      name: string
      email: string
      company?: string
    }
    if (clientDoc._id.toString() !== user.id)
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

    // Verificar que está esperando firma
    if (!project.awaitingSignature)
      return NextResponse.json({ error: 'Este proyecto no requiere firma' }, { status: 400 })

    const now = new Date()

    // Generar el PDF del certificado en memoria
    const pdfBuffer = await generateClosingCertificatePDF({
      project: {
        _id: project._id.toString(),
        name: project.name,
        type: project.type,
      },
      client: {
        name: clientDoc.name,
        email: clientDoc.email,
        company: clientDoc.company,
      },
      clientSignatureData: signatureData,
      adminSignatureData: project.closingSignature?.adminSignatureData ?? null,
      adminName: project.closingSignature?.adminName ?? 'VM Studio',
      signedAt: now,
    })

    // Guardar el PDF como base64 data URL en MongoDB (sin writeFile — Vercel read-only)
    const pdfBase64 = pdfBuffer.toString('base64')
    const certificateUrl = `data:application/pdf;base64,${pdfBase64}`

    // Actualizar el proyecto
    project.awaitingSignature = false
    project.status = 'completado'
    project.completedAt = now
    project.closingSignature = {
      clientSignatureData: signatureData,
      adminSignatureData: project.closingSignature?.adminSignatureData ?? null,
      adminName: project.closingSignature?.adminName ?? 'VM Studio',
      signedAt: now,
      signedByClient: user.id as unknown as import('mongoose').Types.ObjectId,
      signedByAdmin: project.closingSignature?.signedByAdmin ?? null,
      certificateUrl,
    }
    await project.save()

    // Notificar a todos los admins (solo in-app, no push — admins no reciben push)
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isActive: true })
    for (const admin of admins) {
      await sendNotification({
        userId: admin._id.toString(),
        type: 'proyecto',
        title: 'Proyecto firmado',
        message: `${clientDoc.name} firmó el documento de cierre de "${project.name}".`,
        link: `/admin/proyectos/${project._id}`,
      })
    }

    // Email a todos los admins sobre el cierre firmado
    try {
      await sendEmailToAdmins({
        subject: `VM Studio — ${clientDoc.name} firmó el cierre del proyecto`,
        html: emailAdminProyectoCerrado({
          clientName: clientDoc.name,
          projectName: project.name,
          projectId: project._id.toString(),
        }),
      })
    } catch (e) { console.error('[email admin] proyecto cerrado:', e) }

    return NextResponse.json({
      success: true,
      certificateUrl,
      message: 'Proyecto cerrado exitosamente',
    })
  } catch (err) {
    console.error('[POST /api/projects/[id]/sign]', err)
    return NextResponse.json({ error: 'Error al procesar la firma' }, { status: 500 })
  }
}
