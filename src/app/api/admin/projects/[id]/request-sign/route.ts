import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Project from '@/lib/models/Project'
import User from '@/lib/models/User'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'
import { sendNotification } from '@/lib/helpers/sendNotification'
import mongoose from 'mongoose'

// POST /api/admin/projects/[id]/request-sign
// Sets awaitingSignature=true, attaches admin signature data, notifies client
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  if (!mongoose.isValidObjectId(id))
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  await dbConnect()

  const project = await Project.findById(id)
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  if (project.closingSignature?.signedAt)
    return NextResponse.json({ error: 'El proyecto ya fue firmado' }, { status: 400 })

  // Fetch admin's saved signature
  const adminUser = await User.findById(admin.id).select('signatureData name').lean() as {
    _id: unknown; name: string; signatureData?: string | null
  } | null

  project.awaitingSignature = true
  project.status = 'completado'
  project.closingSignature = {
    ...(project.closingSignature ?? {}),
    adminSignatureData: adminUser?.signatureData ?? null,
    adminName: adminUser?.name ?? 'VM Studio',
    signedByAdmin: new mongoose.Types.ObjectId(admin.id),
  }
  await project.save()

  // Notify client
  try {
    await sendNotification({
      userId: project.clientId.toString(),
      type: 'proyecto',
      title: '¡Tu proyecto está listo para firmar!',
      message: `"${project.name}" fue completado. Ingresá para firmar el documento de cierre.`,
      link: `/dashboard/proyectos/${project._id}`,
    })
  } catch { /* optional */ }

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/projects/[id]/request-sign — cancel the signing request
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  if (!mongoose.isValidObjectId(id))
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(id)
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  project.awaitingSignature = false
  await project.save()

  return NextResponse.json({ success: true })
}
