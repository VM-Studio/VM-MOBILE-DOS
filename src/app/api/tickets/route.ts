import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Ticket from '@/lib/models/Ticket'
import User from '@/lib/models/User'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { sendEmailToAdmins } from '@/lib/helpers/sendEmailToAdmins'
import { emailAdminNuevoTicket } from '@/lib/emails/templates'

export async function GET(req: NextRequest) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  const tickets = await Ticket.find({ clientId: user.id })
    .select('ticketNumber title category priority status messages createdAt resolvedAt rating')
    .sort({ createdAt: -1 })
    .lean()
  return NextResponse.json({ tickets })
}

export async function POST(req: NextRequest) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { title, category, priority, description } = await req.json()
  if (!title || !category || !description) {
    return NextResponse.json({ error: 'Título, categoría y descripción son requeridos' }, { status: 400 })
  }

  await dbConnect()

  const ticket = await Ticket.create({
    clientId: user.id,
    title,
    category,
    priority: priority ?? 'media',
    messages: [
      {
        senderId: user.id,
        senderRole: user.role,
        content: description,
        createdAt: new Date(),
      },
    ],
  })

  // Email a todos los admins sobre el nuevo ticket
  try {
    const clientDoc = await User.findById(user.id).select('name').lean() as { name?: string } | null
    const clientName = clientDoc?.name ?? user.email
    await sendEmailToAdmins({
      subject: `VM Studio — Nuevo ticket ${ticket.ticketNumber}`,
      html: emailAdminNuevoTicket({
        clientName,
        ticketNumber: ticket.ticketNumber,
        ticketTitle: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        ticketId: ticket._id.toString(),
      }),
    })
  } catch (e) { console.error('[email admin] nuevo ticket:', e) }

  return NextResponse.json({ ticket }, { status: 201 })
}
