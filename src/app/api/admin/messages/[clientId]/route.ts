import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import Message from '@/lib/models/Message'
import User from '@/lib/models/User'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'
import { sendNotification } from '@/lib/helpers/sendNotification'
import { sendEmail } from '@/lib/auth/sendEmail'
import { emailNuevoMensaje } from '@/lib/emails/templates'

const VALID_ROOM_TYPES = ['soporte-general', 'equipo-dev'] as const
type RoomType = typeof VALID_ROOM_TYPES[number]

const ROOM_DISPLAY_NAMES: Record<RoomType, string> = {
  'soporte-general': 'Soporte General',
  'equipo-dev': 'Equipo de Desarrolladores',
}

function resolveRoomId(roomType: string, clientId: string): string | null {
  if (!VALID_ROOM_TYPES.includes(roomType as RoomType)) return null
  return `${roomType}-${clientId}`
}

// GET /api/admin/messages/[clientId]?roomType=soporte-general|equipo-dev
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { clientId } = await params
  const roomType = req.nextUrl.searchParams.get('roomType') ?? 'soporte-general'
  const roomId = resolveRoomId(roomType, clientId)
  if (!roomId) return NextResponse.json({ error: 'roomType inválido' }, { status: 400 })

  await dbConnect()

  const messages = await Message.find({ roomId })
    .populate('senderId', 'name role')
    .sort({ createdAt: 1 })
    .lean()

  // Mark all client messages as read by admin
  const adminObjId = new mongoose.Types.ObjectId(admin.id)
  await Message.updateMany(
    { roomId, senderRole: 'cliente', readBy: { $ne: adminObjId } },
    { $addToSet: { readBy: adminObjId } }
  )

  return NextResponse.json({ messages })
}

// POST /api/admin/messages/[clientId] — { content, roomType }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const admin = getAdminFromToken(req)
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { clientId } = await params

    let content: string | undefined
    let roomType = 'soporte-general'
    try {
      const body = await req.json()
      content = body?.content
      roomType = body?.roomType ?? 'soporte-general'
    } catch {
      return NextResponse.json({ error: 'Cuerpo de la solicitud inválido' }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
    }

    const roomId = resolveRoomId(roomType, clientId)
    if (!roomId) return NextResponse.json({ error: 'roomType inválido' }, { status: 400 })

    await dbConnect()

    const senderRole = admin.role === 'superadmin' ? 'admin' : admin.role as 'admin' | 'empleado'

    const message = await Message.create({
      roomId,
      senderId: new mongoose.Types.ObjectId(admin.id),
      senderRole,
      content: content.trim(),
      readBy: [new mongoose.Types.ObjectId(admin.id)],
    })

    const populated = await message.populate('senderId', 'name role')

    // Notificar al cliente con el nombre de la sala (no del admin)
    const roomName = ROOM_DISPLAY_NAMES[roomType as RoomType] ?? 'VM Studio'
    try {
      await sendNotification({
        userId: clientId,
        type: 'mensaje',
        title: roomName,
        message: content.trim().substring(0, 80),
        link: '/dashboard/mensajes',
      })
    } catch { /* push es opcional */ }

    // Email nuevo mensaje del equipo al cliente
    try {
      const client = await User.findById(clientId).select('email name').lean()
      if (client) {
        await sendEmail({
          to: client.email,
          subject: `VM Studio — Nuevo mensaje`,
          html: emailNuevoMensaje({
            clientName: client.name,
            roomName,
            messagePreview: content.trim(),
          }),
        })
      }
    } catch (emailErr) {
      console.error('[email] emailNuevoMensaje:', emailErr)
    }

    return NextResponse.json({ message: populated }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/messages/[clientId]]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
