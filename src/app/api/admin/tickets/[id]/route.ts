import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import { sendNotification } from '@/lib/helpers/sendNotification';
import Ticket from '@/lib/models/Ticket';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/auth/sendEmail';
import { emailTicketRespondido, emailTicketResuelto } from '@/lib/emails/templates';

// GET /api/admin/tickets/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();
  const ticket = await Ticket.findById(id).populate('clientId', 'name email company').lean();
  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });

  return NextResponse.json({ ticket });
}

// PATCH /api/admin/tickets/[id] — cambiar estado / prioridad
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();

  const body = await req.json();
  const { status, priority } = body;

  const ticket = await Ticket.findById(id);
  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });

  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (status === 'resuelto' && !ticket.resolvedAt) ticket.resolvedAt = new Date();

  await ticket.save();

  if (status === 'resuelto') {
    await sendNotification({
      userId: ticket.clientId.toString(),
      type: 'ticket',
      title: 'Ticket resuelto',
      message: `Tu ticket #${ticket.ticketNumber}: "${ticket.title}" fue marcado como resuelto.`,
      link: `/dashboard/soporte`,
    });

    // Email ticket resuelto
    try {
      const client = await User.findById(ticket.clientId).select('email name').lean();
      if (client) {
        await sendEmail({
          to: client.email,
          subject: `VM Studio — Tu ticket fue resuelto`,
          html: emailTicketResuelto({
            clientName: client.name,
            ticketNumber: ticket.ticketNumber,
            ticketTitle: ticket.title,
          }),
        });
      }
    } catch (emailErr) {
      console.error('[email] emailTicketResuelto:', emailErr);
    }
  }

  return NextResponse.json({ ticket });
}

// POST /api/admin/tickets/[id] — responder ticket
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();

  const { content, fileUrl } = await req.json();
  if (!content) return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });

  const ticket = await Ticket.findById(id);
  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });

  ticket.messages.push({
    senderId: new mongoose.Types.ObjectId(admin.id),
    senderRole: 'admin',
    content,
    fileUrl,
    createdAt: new Date(),
  });

  if (ticket.status === 'abierto') ticket.status = 'en_proceso';

  await ticket.save();

  await sendNotification({
    userId: ticket.clientId.toString(),
    type: 'ticket',
    title: 'Nueva respuesta en tu ticket',
    message: `El equipo de VM Studio respondió tu ticket #${ticket.ticketNumber}.`,
    link: `/dashboard/soporte`,
  });

  // Email ticket respondido
  try {
    const client = await User.findById(ticket.clientId).select('email name').lean();
    if (client) {
      await sendEmail({
        to: client.email,
        subject: `VM Studio — Respondieron tu ticket`,
        html: emailTicketRespondido({
          clientName: client.name,
          ticketNumber: ticket.ticketNumber,
          ticketTitle: ticket.title,
          ticketId: ticket._id.toString(),
        }),
      });
    }
  } catch (emailErr) {
    console.error('[email] emailTicketRespondido:', emailErr);
  }

  return NextResponse.json({ ticket });
}
