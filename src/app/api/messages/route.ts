import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Message from '@/lib/models/Message'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'

const FIXED_ROOMS = [
  {
    key: 'soporte-general',
    nombre: 'Soporte General',
    descripcion: 'Escribinos ante cualquier consulta',
  },
  {
    key: 'equipo-dev',
    nombre: 'Equipo de Desarrolladores',
    descripcion: 'Seguimiento de tu proyecto',
  },
]

export async function GET(req: NextRequest) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  const rooms = await Promise.all(
    FIXED_ROOMS.map(async (room) => {
      const roomId = `${room.key}-${user.id}`
      const lastMsg = await Message.findOne({ roomId }).sort({ createdAt: -1 }).lean()
      const unread = await Message.countDocuments({
        roomId,
        readBy: { $ne: user.id },
        senderId: { $ne: user.id },
      })
      return {
        roomId,
        nombre: room.nombre,
        descripcion: room.descripcion,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt ?? null,
        unreadCount: unread,
      }
    })
  )

  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0)

  return NextResponse.json({ rooms, totalUnread })
}
