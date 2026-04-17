import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import Message from '@/lib/models/Message'
import User from '@/lib/models/User'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'

// GET /api/admin/messages/unread — total unread messages from clients across both fixed rooms
export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  const adminObjId = new mongoose.Types.ObjectId(admin.id)

  // Get all active client IDs
  const clients = await User.find({ role: 'cliente', isActive: true }).select('_id').lean()

  // Build all roomIds for both fixed rooms
  const roomIds = clients.flatMap((c) => [
    `soporte-general-${c._id}`,
    `equipo-dev-${c._id}`,
  ])

  const total = await Message.countDocuments({
    roomId: { $in: roomIds },
    senderRole: 'cliente',
    readBy: { $not: { $elemMatch: { $eq: adminObjId } } },
  })

  return NextResponse.json({ unread: total })
}
