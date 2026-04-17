import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Message from '@/lib/models/Message'
import User from '@/lib/models/User'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { sendNotification } from '@/lib/helpers/sendNotification'
import { sendEmailToAdmins } from '@/lib/helpers/sendEmailToAdmins'
import { emailAdminNuevoMensaje } from '@/lib/emails/templates'

function getRoomDisplayName(roomId: string): string {
  if (roomId.startsWith('soporte-general-')) return 'Soporte General'
  if (roomId.startsWith('equipo-dev-')) return 'Equipo de Desarrolladores'
  return 'VM Studio'
}

function isClientRoom(roomId: string, userId: string): boolean {
  return (
    roomId === `soporte-general-${userId}` ||
    roomId === `equipo-dev-${userId}`
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { roomId } = await params

  if (!isClientRoom(roomId, user.id)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  await dbConnect()

  const messages = await Message.find({ roomId })
    .populate('senderId', 'name role')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  // Mark all messages as read by this user
  await Message.updateMany(
    { roomId, readBy: { $ne: user.id } },
    { $addToSet: { readBy: user.id } }
  )

  const roomName = getRoomDisplayName(roomId)

  const formattedMessages = messages.map((msg) => {
    const senderRole = msg.senderRole as string
    const isClient = senderRole === 'cliente'
    return {
      _id: msg._id,
      content: msg.content,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      createdAt: msg.createdAt,
      senderRole,
      isOwn: isClient,
      senderName: isClient ? 'Vos' : roomName,
      senderAvatar: isClient ? 'cliente' : 'vm-studio',
    }
  }).reverse() // sort desc + limit 50 → reverse para orden cronológico asc

  return NextResponse.json({ messages: formattedMessages })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { roomId } = await params

  if (!isClientRoom(roomId, user.id)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { content, fileUrl, fileName } = await req.json()

  if (!content && !fileUrl) {
    return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }

  await dbConnect()

  const message = await Message.create({
    roomId,
    senderId: user.id,
    senderRole: user.role,
    content,
    fileUrl,
    fileName,
    readBy: [user.id],
  })

  const roomName = getRoomDisplayName(roomId)
  const msgText = (content ?? '').substring(0, 80)

  // Notificar a TODOS los admins y superadmins (solo in-app, no push — admins no reciben push)
  try {
    const admins = await User.find({
      role: { $in: ['admin', 'superadmin'] },
      isActive: true,
    }).select('_id').lean()

    const clientUser = await User.findById(user.id).select('name').lean()
    const clientName = (clientUser as { name?: string } | null)?.name ?? 'Cliente'
    const notifBody = `${clientName} (${roomName}): ${msgText}`

    await Promise.all(
      admins.map(async (admin) => {
        const adminId = admin._id.toString()
        await sendNotification({
          userId: adminId,
          type: 'mensaje',
          title: 'Nuevo mensaje de cliente',
          message: notifBody,
          link: '/admin/mensajes',
        })
      })
    )
  } catch { /* notificaciones son opcionales */ }

  // Email a todos los admins cuando el cliente envía un mensaje
  try {
    const clientUser = await User.findById(user.id).select('name email').lean() as { name?: string; email?: string } | null
    const clientName = clientUser?.name ?? 'Cliente'
    const clientEmail = clientUser?.email ?? ''
    await sendEmailToAdmins({
      subject: `VM Studio — Nuevo mensaje de ${clientName}`,
      html: emailAdminNuevoMensaje({
        clientName,
        clientEmail,
        roomName,
        messagePreview: content ?? '',
        clientId: user.id,
      }),
    })
  } catch (e) { console.error('[email admin] mensaje:', e) }

  return NextResponse.json({
    message: {
      _id: message._id,
      content: message.content,
      createdAt: message.createdAt,
      senderRole: message.senderRole,
      isOwn: true,
      senderName: 'Vos',
      senderAvatar: 'cliente',
    }
  }, { status: 201 })
}
