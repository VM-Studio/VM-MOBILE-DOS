import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Invoice from '@/lib/models/Invoice';
import Ticket from '@/lib/models/Ticket';
import Quote from '@/lib/models/Quote';

export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const [
    totalClients,
    activeProjects,
    pendingInvoices,
    openTickets,
    newQuotes,
    revenueResult,
    recentProjects,
    recentQuotes,
  ] = await Promise.all([
    User.countDocuments({ role: 'cliente' }),
    Project.countDocuments({ status: { $in: ['en_progreso', 'en_revision'] } }),
    Invoice.countDocuments({ status: 'pendiente' }),
    Ticket.countDocuments({ status: { $in: ['abierto', 'en_proceso'] } }),
    Quote.countDocuments({ status: 'nueva' }),
    Invoice.aggregate([
      { $match: { status: 'pagada' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('clientId', 'name email company')
      .lean(),
    Quote.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const totalRevenue = revenueResult[0]?.total ?? 0;

  return NextResponse.json({
    totalClients,
    activeProjects,
    pendingInvoices,
    openTickets,
    newQuotes,
    totalRevenue,
    recentProjects,
    recentQuotes,
  });
}
