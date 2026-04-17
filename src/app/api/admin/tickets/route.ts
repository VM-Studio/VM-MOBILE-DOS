import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import Ticket from '@/lib/models/Ticket';

// GET /api/admin/tickets
export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const category = searchParams.get('category') || '';
  const clientId = searchParams.get('clientId') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (clientId) query.clientId = clientId;

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('clientId', 'name email company')
      .lean(),
    Ticket.countDocuments(query),
  ]);

  return NextResponse.json({ tickets, total, page, pages: Math.ceil(total / limit) });
}
