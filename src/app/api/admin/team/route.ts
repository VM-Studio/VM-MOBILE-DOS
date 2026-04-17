import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

// GET /api/admin/team — lista admins/equipo
export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const team = await User.find({ role: { $in: ['admin', 'superadmin'] } })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ members: team });
}

// POST /api/admin/team — crear miembro del equipo
export async function POST(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin || admin.role !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin puede crear miembros del equipo' }, { status: 403 });
  }

  await dbConnect();

  const body = await req.json();
  const { name, email, password, role, position } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const member = await User.create({
    name,
    email,
    password: hashed,
    role: role === 'superadmin' ? 'superadmin' : 'admin',
    position,
    isVerified: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safe } = member.toObject();
  return NextResponse.json({ member: safe }, { status: 201 });
}
