import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

// PATCH /api/admin/team/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();

  const body = await req.json();
  const allowed = ['name', 'phone', 'position', 'isVerified'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const member = await User.findByIdAndUpdate(id, update, { new: true }).select('-password');
  if (!member) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });

  return NextResponse.json({ member });
}

// DELETE /api/admin/team/[id] — solo superadmin
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin || admin.role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin puede eliminar miembros' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  if (id === admin.id) {
    return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 });
  }

  await dbConnect();
  await User.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Miembro eliminado' });
}
