import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Invoice from '@/lib/models/Invoice';
import Ticket from '@/lib/models/Ticket';

export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const [
    totalClients,
    activeProjects,
    pendingInvoices,
    openTickets,
    revenueResult,
    recentProjects,
  ] = await Promise.all([
    User.countDocuments({ role: 'cliente' }),
    Project.countDocuments({ status: { $in: ['en_progreso', 'en_revision'] } }),
    Invoice.countDocuments({ status: 'pendiente' }),
    Ticket.countDocuments({ status: { $in: ['abierto', 'en_proceso'] } }),
    Invoice.aggregate([
      { $match: { status: 'pagada' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('clientId', 'name email company')
      .lean(),
  ]);

  const totalRevenue = revenueResult[0]?.total ?? 0;

  return NextResponse.json({
    totalClients,
    activeProjects,
    pendingInvoices,
    openTickets,
    totalRevenue,
    recentProjects,
  });
}
