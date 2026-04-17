import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getClientFromToken } from '@/lib/helpers/getClientFromToken';
import Notification from '@/lib/models/Notification';
import mongoose from 'mongoose';

// PUT /api/notifications/[id]/read — marcar una como leída
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = getClientFromToken(req);
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: client.id },
    { read: true },
    { new: true }
  );

  if (!notification) return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });

  return NextResponse.json({ notification });
}
