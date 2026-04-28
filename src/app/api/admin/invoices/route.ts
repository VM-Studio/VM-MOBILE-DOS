import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import { sendNotification } from '@/lib/helpers/sendNotification';
import { generateInvoiceNumber, formatInvoiceNumber } from '@/lib/helpers/generateInvoiceNumber';
import Invoice from '@/lib/models/Invoice';
import User from '@/lib/models/User';
import { sendEmail } from '@/lib/auth/sendEmail';
import { emailFacturaCreada } from '@/lib/emails/templates';

// GET /api/admin/invoices
export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const clientId = searchParams.get('clientId') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};
  if (status) query.status = status;
  if (clientId) query.clientId = clientId;

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('clientId', 'name email company')
      .lean(),
    Invoice.countDocuments(query),
  ]);

  return NextResponse.json({ invoices, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/admin/invoices — crear factura
export async function POST(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const body = await req.json();
  const { clientId, number: providedNumber, description, items, amount, dueDate } = body;

  if (!clientId || !description || !amount) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  // Si el admin no provee un número, se genera automáticamente
  const number = providedNumber
    ? String(providedNumber)
    : formatInvoiceNumber(await generateInvoiceNumber())

  const invoice = await Invoice.create({
    clientId,
    number,
    description,
    items: items || [],
    amount,
    dueDate,
    status: 'pendiente',
    issuedAt: new Date(),
  });

  const client = await User.findById(clientId).lean();
  if (client) {
    await sendNotification({
      userId: clientId,
      type: 'factura',
      title: `Nueva factura: ${number}`,
      message: `Tenés una nueva factura por $${amount} con vencimiento ${dueDate ? new Date(dueDate).toLocaleDateString('es-AR') : 'a definir'}.`,
      link: `/dashboard/facturacion`,
    });

    // Email factura creada
    try {
      await sendEmail({
        to: client.email,
        subject: `VM Studio — Nueva factura #${number}`,
        html: emailFacturaCreada({
          clientName: client.name,
          invoiceNumber: number,
          description,
          amount,
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      });
    } catch (emailErr) {
      console.error('[email] emailFacturaCreada:', emailErr);
    }
  }

  return NextResponse.json({ invoice }, { status: 201 });
}
