import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getClientFromToken } from '@/lib/helpers/getClientFromToken';
import Notification from '@/lib/models/Notification';

// GET /api/notifications — notificaciones del cliente logueado
export async function GET(req: NextRequest) {
  const client = getClientFromToken(req);
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = parseInt(searchParams.get('limit') || '30');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = { userId: client.id };
  if (unreadOnly) query.read = false;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({ userId: client.id, read: false });

  return NextResponse.json({ notifications, unreadCount });
}

// PUT /api/notifications — marcar todas como leídas
export async function PUT(req: NextRequest) {
  const client = getClientFromToken(req);
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();
  await Notification.updateMany({ userId: client.id, read: false }, { read: true });

  return NextResponse.json({ message: 'Todas marcadas como leídas' });
}
