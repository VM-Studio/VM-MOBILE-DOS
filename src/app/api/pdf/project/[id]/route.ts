import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Project from '@/lib/models/Project'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'
import { generateProjectSummaryPDF } from '@/lib/pdf/generators/generateProjectSummaryPDF'

type ProjectLean = {
  _id: { toString(): string }
  clientId: { _id: { toString(): string }, name: string, email: string, company?: string }
  name: string
  type: string
  status: string
  progress: number
  description?: string
  previewUrl?: string
  startDate?: Date
  estimatedEndDate?: Date
  completedAt?: Date
  budget?: number
  stages: { name: string, order: number, status: string, description?: string, completedAt?: Date }[]
  updates: { message: string, createdAt: Date }[]
  files: { name: string, url: string, category: string, uploadedAt: Date }[]
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getClientFromToken(req)
    const admin = getAdminFromToken(req)

    if (!client && !admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await dbConnect()

    const project = await Project.findById(id)
      .populate('clientId', 'name email company')
      .lean() as ProjectLean | null

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar ownership para clientes
    if (client && !admin) {
      if (project.clientId._id.toString() !== client.id) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    }

    const sortedStages = [...project.stages].sort((a, b) => a.order - b.order)
    const recentUpdates = [...project.updates]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

    const dateStr = new Date().toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).replace(/\//g, '-')

    const safeName = project.name.replace(/[^a-zA-Z0-9-_]/g, '_')

    const pdfBuffer = await generateProjectSummaryPDF({
      project: {
        name: project.name,
        type: project.type,
        status: project.status,
        progress: project.progress,
        description: project.description,
        startDate: project.startDate,
        estimatedEndDate: project.estimatedEndDate,
        completedAt: project.completedAt,
        budget: project.budget,
        previewUrl: project.previewUrl,
        stages: sortedStages,
        updates: recentUpdates,
        files: project.files,
      },
      client: {
        name: project.clientId.name,
        company: project.clientId.company,
        email: project.clientId.email,
      },
    })

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="VM-Proyecto-${safeName}-${dateStr}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('[GET /api/pdf/project/[id]]', err)
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 })
  }
}
