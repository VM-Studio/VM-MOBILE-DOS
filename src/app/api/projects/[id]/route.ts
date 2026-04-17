import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Project from '@/lib/models/Project'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await dbConnect()

  const project = await Project.findById(id).lean()
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  if (project.clientId.toString() !== user.id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  // Recalculate progress from stages
  const total = project.stages?.length ?? 0
  const done = project.stages?.filter((s) => s.status === 'completado').length ?? 0
  const computedProgress = total > 0 ? Math.round((done / total) * 100) : project.progress ?? 0

  return NextResponse.json({ project: { ...project, progress: computedProgress } })
}
