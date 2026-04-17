import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Project from '@/lib/models/Project'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'

export async function GET(req: NextRequest) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  // Include stages so we can recalculate progress accurately
  const projects = await Project.find({ clientId: user.id })
    .select('name type status progress startDate estimatedEndDate createdAt stages stagingUrl previewUrl previewImageUrl lastDeployAt lastDeployMessage awaitingSignature closingSignature')
    .sort({ createdAt: -1 })
    .lean()

  // Recalculate progress from stages for each project and persist if stale
  const fixed = projects.map((p) => {
    const total = p.stages?.length ?? 0
    const done = p.stages?.filter((s) => s.status === 'completado').length ?? 0
    const computed = total > 0 ? Math.round((done / total) * 100) : p.progress ?? 0
    return { ...p, progress: computed }
  })

  return NextResponse.json({ projects: fixed })
}
