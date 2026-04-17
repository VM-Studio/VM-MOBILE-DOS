import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Message from '@/lib/models/Message'
import User from '@/lib/models/User'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'

const ROOM_TYPES = [
  { key: 'soporte-general', nombre: 'Soporte General' },
  { key: 'equipo-dev', nombre: 'Equipo de Desarrolladores' },
]

// GET /api/admin/messages — list all clients with their two fixed rooms
export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  const clients = await User.find({ role: 'cliente', isActive: true })
    .select('name email company')
    .sort({ name: 1 })
    .lean()

  const clientsWithRooms = await Promise.all(
    clients.map(async (client) => {
      const clientId = client._id.toString()
      const rooms = await Promise.all(
        ROOM_TYPES.map(async (rt) => {
          const roomId = `${rt.key}-${clientId}`
          const lastMsg = await Message.findOne({ roomId }).sort({ createdAt: -1 }).lean()
          const unread = await Message.countDocuments({
            roomId,
            senderRole: 'cliente',
            readBy: { $not: { $elemMatch: { $eq: admin.id } } },
          })
          return {
            roomId,
            roomType: rt.key,
            nombre: rt.nombre,
            lastMessage: lastMsg?.content ?? null,
            lastMessageAt: lastMsg?.createdAt ?? null,
            unreadCount: unread,
          }
        })
      )
      const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0)
      return {
        _id: client._id,
        name: (client as { name?: string }).name ?? '',
        email: (client as { email?: string }).email ?? '',
        company: (client as { company?: string }).company,
        rooms,
        totalUnread,
      }
    })
  )

  return NextResponse.json({ clients: clientsWithRooms })
}
