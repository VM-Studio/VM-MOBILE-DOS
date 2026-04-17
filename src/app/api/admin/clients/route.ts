import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import User from '@/lib/models/User';

// GET /api/admin/clients — lista todos los clientes
export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const query = search
    ? {
        role: 'cliente',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
        ],
      }
    : { role: 'cliente' };

  const [clients, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return NextResponse.json({ clients, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/admin/clients — crear nuevo cliente
export async function POST(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const body = await req.json();
  const { name, email, password, phone, company, position, website, address } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
  }

  const client = await User.create({
    name,
    email,
    password,  // pre('save') hook in User model hashes it automatically
    phone,
    company,
    position,
    website,
    address,
    role: 'cliente',
    isVerified: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safe } = client.toObject();
  return NextResponse.json({ client: safe }, { status: 201 });
}
