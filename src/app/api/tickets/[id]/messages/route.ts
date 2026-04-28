import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Ticket from '@/lib/models/Ticket'
import User from '@/lib/models/User'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { sendEmailToAdmins } from '@/lib/helpers/sendEmailToAdmins'
import { emailAdminClienteRespondiTicket } from '@/lib/emails/templates'

async function getTicketForUser(id: string, userId: string) {
  const ticket = await Ticket.findById(id)
  if (!ticket) return null
  if (ticket.clientId.toString() !== userId) return null
  return ticket
}

// POST /api/tickets/[id]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { content, fileUrl } = await req.json()
  if (!content && !fileUrl) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })

  await dbConnect()

  const ticket = await getTicketForUser(id, user.id)
  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })

  ticket.messages.push({ senderId: ticket.clientId, senderRole: user.role, content, fileUrl, createdAt: new Date() })
  await ticket.save()

  // Email a admins cuando el cliente responde
  try {
    const clientDoc = await User.findById(user.id).select('name').lean()
    const clientName = clientDoc?.name ?? 'Cliente'
    await sendEmailToAdmins({
      subject: `VM Studio — ${clientName} respondió en ticket #${ticket.ticketNumber}`,
      html: emailAdminClienteRespondiTicket({
        clientName,
        clientEmail: user.email,
        ticketNumber: ticket.ticketNumber,
        ticketTitle: ticket.title,
        messagePreview: content ? content.slice(0, 200) : '(archivo adjunto)',
        ticketId: ticket._id.toString(),
      }),
    })
  } catch { /* email opcional */ }

  return NextResponse.json({ ticket })
}
