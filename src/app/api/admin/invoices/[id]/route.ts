import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import { sendNotification } from '@/lib/helpers/sendNotification';
import { sendEmail } from '@/lib/auth/sendEmail';
import { syncPlanAsignado } from '@/lib/helpers/processPayment';
import Invoice from '@/lib/models/Invoice';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

// GET /api/admin/invoices/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();
  const invoice = await Invoice.findById(id).populate('clientId', 'name email company').lean();
  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });

  return NextResponse.json({ invoice });
}

// PATCH /api/admin/invoices/[id] — actualizar estado / registrar pago
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();

  const body = await req.json();
  const { status, paymentMethod, paymentId, dueDate } = body;

  const invoice = await Invoice.findById(id);
  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });

  const prevStatus = invoice.status;

  if (status) invoice.status = status;
  if (paymentMethod) invoice.paymentMethod = paymentMethod;
  if (paymentId) invoice.paymentId = paymentId;
  if (dueDate) invoice.dueDate = new Date(dueDate);
  if (status === 'pagado' && !invoice.paidAt) invoice.paidAt = new Date();

  await invoice.save();

  // Sincronizar PlanAsignado si se confirma el pago manualmente
  if (status === 'pagado' && prevStatus !== 'pagado') {
    await syncPlanAsignado(id)
  }

  // Notificar al cliente si se registra pago
  if (status === 'pagado' && prevStatus !== 'pagado') {
    const client = await User.findById(invoice.clientId).lean();
    if (client) {
      await sendNotification({
        userId: invoice.clientId.toString(),
        type: 'factura',
        title: 'Pago registrado',
        message: `Tu pago de la factura #${invoice.number} fue confirmado. ¡Gracias!`,
        link: `/dashboard/facturacion`,
      });

      await sendEmail({
        to: client.email,
        subject: `Pago confirmado: Factura #${invoice.number}`,
        html: `<p>Hola ${client.name},</p><p>Tu pago de la factura <strong>#${invoice.number}</strong> por $${invoice.amount} fue confirmado exitosamente.</p><p>¡Gracias por confiar en VM Studio!</p>`,
      });
    }
  }

  return NextResponse.json({ invoice });
}

// DELETE /api/admin/invoices/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();
  await Invoice.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Factura eliminada' });
}
