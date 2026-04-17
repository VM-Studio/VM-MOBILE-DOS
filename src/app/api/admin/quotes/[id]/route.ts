import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import Quote from '@/lib/models/Quote';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// GET /api/admin/quotes/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();
  const quote = await Quote.findById(id)
    .populate('assignedTo', 'name email')
    .populate('convertedToProject', 'name status')
    .lean();

  if (!quote) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });

  return NextResponse.json({ quote });
}

// PATCH /api/admin/quotes/[id] — actualizar estado/notas
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();

  const body = await req.json();
  const { status, notes, assignedTo } = body;

  const quote = await Quote.findById(id);
  if (!quote) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });

  if (status && status !== quote.status) {
    quote.status = status;
    quote.statusHistory.push({ status, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(admin.id) });
  }
  if (notes !== undefined) quote.notes = notes;
  if (assignedTo !== undefined) quote.assignedTo = assignedTo;

  await quote.save();
  return NextResponse.json({ quote });
}

// POST /api/admin/quotes/[id] — convertir cotización en proyecto + cliente
// body: { action: 'convert', projectName, projectType, tempPassword? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();

  const body = await req.json();
  const { action, projectName, projectType, tempPassword } = body;

  if (action !== 'convert') return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });

  const quote = await Quote.findById(id);
  if (!quote) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });

  // Crear o encontrar el cliente
  let client = await User.findOne({ email: quote.email });
  const password = tempPassword || Math.random().toString(36).slice(-8);

  if (!client) {
    const hashed = await bcrypt.hash(password, 10);
    client = await User.create({
      name: quote.name,
      email: quote.email,
      password: hashed,
      phone: quote.phone,
      company: quote.company,
      role: 'cliente',
      isVerified: true,
    });
  }

  // Crear el proyecto
  const project = await Project.create({
    clientId: client._id,
    name: projectName || `Proyecto ${quote.name}`,
    type: projectType || 'web',
    status: 'en_progreso',
    progress: 0,
    description: quote.message,
    budget: quote.budget ? parseFloat(quote.budget) : undefined,
  });

  // Marcar cotización como ganada
  quote.status = 'ganada';
  quote.statusHistory.push({ status: 'ganada', changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(admin.id) });
  quote.convertedToProject = project._id as mongoose.Types.ObjectId;
  await quote.save();

  return NextResponse.json({ quote, project, client: { _id: client._id, name: client.name, email: client.email }, tempPassword: !tempPassword ? password : undefined });
}

// DELETE /api/admin/quotes/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();
  await Quote.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Cotización eliminada' });
}
