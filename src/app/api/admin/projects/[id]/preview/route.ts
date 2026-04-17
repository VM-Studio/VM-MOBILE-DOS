import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'
import { sendNotification } from '@/lib/helpers/sendNotification'
import Project from '@/lib/models/Project'
import User from '@/lib/models/User'
import mongoose from 'mongoose'
import { sendEmail } from '@/lib/auth/sendEmail'
import { emailNuevoAvance } from '@/lib/emails/templates'

// GET /api/admin/projects/[id]/preview
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  await dbConnect()
  const project = await Project.findById(id)
    .select('stagingUrl previewImageUrl previewUpdatedAt lastDeployAt lastDeployMessage deployHistory clientId')
    .lean()
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  return NextResponse.json({
    stagingUrl: project.stagingUrl ?? null,
    previewImageUrl: project.previewImageUrl ?? null,
    previewUpdatedAt: project.previewUpdatedAt ?? null,
    lastDeployAt: project.lastDeployAt ?? null,
    lastDeployMessage: project.lastDeployMessage ?? null,
    deployHistory: project.deployHistory ?? [],
  })
}

// POST /api/admin/projects/[id]/preview
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body = await req.json()
  const { stagingUrl, message } = body as { stagingUrl?: string; message?: string }

  if (!stagingUrl || typeof stagingUrl !== 'string') {
    return NextResponse.json({ error: 'stagingUrl es requerido' }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(stagingUrl.trim())
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Protocolo inválido')
    }
  } catch {
    return NextResponse.json({ error: 'URL inválida. Debe comenzar con http:// o https://' }, { status: 400 })
  }

  await dbConnect()
  const project = await Project.findById(id)
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  // Captura del screenshot — intentamos múltiples servicios en orden de velocidad
  let screenshotUrl: string | null = null

  // Intento 1: thum.io — devuelve la imagen directamente como URL, ~1-2s, sin API key
  try {
    const thumbUrl = `https://image.thum.io/get/width/1280/viewportWidth/1280/noanimate/${parsedUrl.toString()}`
    const headRes = await fetch(thumbUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
    if (headRes.ok) {
      screenshotUrl = thumbUrl
    }
  } catch {
    // sigue al siguiente
  }

  // Intento 2: Microlink — más lento pero devuelve imagen hosteada
  if (!screenshotUrl) {
    try {
      const microlinkRes = await fetch(
        `https://api.microlink.io?url=${encodeURIComponent(parsedUrl.toString())}&screenshot=true&meta=false&force=true`,
        { signal: AbortSignal.timeout(12000) }
      )
      if (microlinkRes.ok) {
        const microlinkData = await microlinkRes.json()
        screenshotUrl = microlinkData?.data?.screenshot?.url ?? null
      }
    } catch {
      // sigue sin screenshot
    }
  }

  // Intento 3: si todo falla, guardar la URL de thum.io directamente sin verificar
  if (!screenshotUrl) {
    screenshotUrl = `https://image.thum.io/get/width/1280/viewportWidth/1280/noanimate/${parsedUrl.toString()}`
  }

  const now = new Date()
  const adminObjectId = new mongoose.Types.ObjectId(admin.id)

  // Prepend to deploy history, keep last 5
  const newHistoryItem = {
    deployedAt: now,
    deployedBy: adminObjectId,
    message: message?.trim() || null,
    previewImageUrl: screenshotUrl,
    stagingUrl: parsedUrl.toString(),
  }
  const updatedHistory = [newHistoryItem, ...(project.deployHistory ?? [])].slice(0, 5)

  project.stagingUrl = parsedUrl.toString()
  project.previewImageUrl = screenshotUrl ?? undefined
  project.previewUpdatedAt = now
  project.lastDeployAt = now
  project.lastDeployBy = adminObjectId
  project.lastDeployMessage = message?.trim() || undefined
  project.deployHistory = updatedHistory as typeof project.deployHistory

  await project.save()

  // Notify client
  const clientId = project.clientId?.toString()
  if (clientId) {
    try {
      await sendNotification({
        userId: clientId,
        type: 'proyecto',
        title: 'Preview actualizado',
        message: message?.trim()
          ? `Nuevo deploy: ${message.trim()}`
          : 'Tu sitio tiene una nueva versión lista para revisar.',
        link: `/dashboard/proyectos/${id}`,
      })
    } catch {
      // Notification errors should not fail the request
    }

    // Email nuevo avance
    try {
      const client = await User.findById(clientId).select('email name').lean()
      if (client) {
        await sendEmail({
          to: client.email,
          subject: `VM Studio — Nuevo avance en tu proyecto`,
          html: emailNuevoAvance({
            clientName: client.name,
            projectName: project.name,
            deployMessage: message?.trim() || 'Nueva versión disponible',
            projectId: id,
          }),
        })
      }
    } catch (emailErr) {
      console.error('[email] emailNuevoAvance:', emailErr)
    }
  }

  return NextResponse.json({
    success: true,
    stagingUrl: project.stagingUrl,
    previewImageUrl: project.previewImageUrl,
    previewUpdatedAt: project.previewUpdatedAt,
    lastDeployAt: project.lastDeployAt,
    lastDeployMessage: project.lastDeployMessage,
    deployHistory: project.deployHistory,
  })
}
