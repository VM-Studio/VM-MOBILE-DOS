import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import Quote from '@/lib/models/Quote';

// GET /api/admin/quotes
export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const [quotes, total] = await Promise.all([
    Quote.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email')
      .lean(),
    Quote.countDocuments(query),
  ]);

  return NextResponse.json({ quotes, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/admin/quotes — crear cotización desde CRM
export async function POST(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const body = await req.json();
  const { name, email, company, phone, service, businessType, budget, message, wantsWhatsapp } = body;

  if (!name || !email || !service) {
    return NextResponse.json({ error: 'Nombre, email y servicio son requeridos' }, { status: 400 });
  }

  const quote = await Quote.create({
    name,
    email,
    company,
    phone,
    service,
    businessType,
    budget,
    message,
    wantsWhatsapp,
    status: 'nueva',
    statusHistory: [{ status: 'nueva', changedAt: new Date() }],
  });

  return NextResponse.json({ quote }, { status: 201 });
}
