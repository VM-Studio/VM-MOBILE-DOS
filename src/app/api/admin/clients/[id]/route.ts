import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Invoice from '@/lib/models/Invoice';
import Ticket from '@/lib/models/Ticket';
import mongoose from 'mongoose';

// GET /api/admin/clients/[id] — detalle de cliente
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  await dbConnect();

  const [client, projects, invoices, tickets] = await Promise.all([
    User.findById(id).select('-password').lean(),
    Project.find({ client: id }).sort({ createdAt: -1 }).lean(),
    Invoice.find({ client: id }).sort({ createdAt: -1 }).lean(),
    Ticket.find({ client: id }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  return NextResponse.json({ client, projects, invoices, tickets });
}

// PATCH /api/admin/clients/[id] — editar cliente
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  await dbConnect();

  const body = await req.json();
  const allowed = ['name', 'email', 'phone', 'company', 'position', 'website', 'address', 'isVerified'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const client = await User.findByIdAndUpdate(id, update, { new: true }).select('-password');
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  return NextResponse.json({ client });
}

// DELETE /api/admin/clients/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  await dbConnect();

  await User.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Cliente eliminado' });
}
