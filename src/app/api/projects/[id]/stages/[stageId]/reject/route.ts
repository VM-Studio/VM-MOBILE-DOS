import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Project, { IStage } from '@/lib/models/Project'
import User from '@/lib/models/User'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { sendEmailToAdmins } from '@/lib/helpers/sendEmailToAdmins'
import { emailAdminEtapaRechazada } from '@/lib/emails/templates'

function calcProgress(stages: IStage[]): number {
  if (!stages || stages.length === 0) return 0
  const done = stages.filter((s) => s.status === 'completado').length
  return Math.round((done / stages.length) * 100)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, stageId } = await params
  const { comment } = await req.json()

  await dbConnect()

  const project = await Project.findById(id)
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  if (project.clientId.toString() !== user.id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const stage = project.stages.find((s) => s._id.toString() === stageId)
  if (!stage) return NextResponse.json({ error: 'Etapa no encontrada' }, { status: 404 })

  stage.status = 'rechazado'
  stage.rejectedAt = new Date()
  stage.rejectionComment = comment ?? ''
  project.updates.push({
    message: `El cliente rechazó la etapa "${stage.name}"${comment ? `: ${comment}` : ''}`,
    createdAt: new Date(),
  })
  project.progress = calcProgress(project.stages)
  await project.save()

  // Email a todos los admins
  try {
    const clientDoc = await User.findById(user.id).select('name').lean() as { name?: string } | null
    const clientName = clientDoc?.name ?? user.email
    await sendEmailToAdmins({
      subject: `VM Studio — ${clientName} rechazó la etapa ${stage.name}`,
      html: emailAdminEtapaRechazada({
        clientName,
        projectName: project.name,
        stageName: stage.name,
        rejectionComment: comment ?? '',
        projectId: project._id.toString(),
      }),
    })
  } catch (e) { console.error('[email admin] etapa rechazada:', e) }

  return NextResponse.json({ project })
}
