import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import { sendNotification } from '@/lib/helpers/sendNotification';
import Project from '@/lib/models/Project';
import Invoice from '@/lib/models/Invoice';
import User from '@/lib/models/User';
import { sendEmail } from '@/lib/auth/sendEmail';
import { emailProyectoCreado } from '@/lib/emails/templates';

// GET /api/admin/projects — lista todos los proyectos
export async function GET(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const clientId = searchParams.get('clientId') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};
  if (status) query.status = status;
  if (clientId) query.clientId = clientId;
  if (search) query.name = { $regex: search, $options: 'i' };

  const [projects, total] = await Promise.all([
    Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('clientId', 'name email company')
      .lean(),
    Project.countDocuments(query),
  ]);

  // Recalculate progress from stages for each project
  const projectsWithProgress = projects.map((p) => {
    const total = p.stages?.length ?? 0;
    const done = p.stages?.filter((s) => s.status === 'completado').length ?? 0;
    return { ...p, progress: total > 0 ? Math.round((done / total) * 100) : p.progress ?? 0 };
  });

  return NextResponse.json({ projects: projectsWithProgress, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/admin/projects — crear nuevo proyecto
export async function POST(req: NextRequest) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbConnect();

  const body = await req.json();
  const { clientId, name, type, description, startDate, estimatedEndDate, budget, stages, previewUrl } = body;

  if (!clientId || !name) {
    return NextResponse.json({ error: 'Cliente y nombre son requeridos' }, { status: 400 });
  }

  const project = await Project.create({
    clientId,
    name,
    type,
    description,
    startDate,
    estimatedEndDate,
    budget: budget ?? null,
    previewUrl,
    stages: stages || [],
    status: 'en_progreso',
    progress: 0,
  });

  // Si hay previewUrl → guardar screenshot de thum.io al instante (sin bloquear)
  if (previewUrl) {
    const thumbUrl = `https://image.thum.io/get/width/1280/viewportWidth/1280/noanimate/${previewUrl.trim()}`
    Project.updateOne({ _id: project._id }, { previewImageUrl: thumbUrl }).catch(() => {})
  }

  // Si hay presupuesto → generar las 2 facturas automáticamente
  if (budget && budget > 0) {
    const mitad = Math.round(budget / 2);
    const mitadResto = budget - mitad;

    const lastInvoice = await Invoice.findOne()
      .sort({ createdAt: -1 })
      .select('number')
      .lean();
    const lastNum = lastInvoice
      ? parseInt((lastInvoice.number as string).replace(/\D/g, '')) || 0
      : 0;

    const invoice1Data = {
      clientId,
      projectId: project._id,
      number: `F-${String(lastNum + 1).padStart(5, '0')}`,
      description: `${name} — Anticipo 50% (inicio del proyecto)`,
      amount: mitad,
      status: 'pendiente' as const,
      issuedAt: new Date(),
      dueDate: startDate ? new Date(startDate) : new Date(),
      invoiceType: 'anticipo' as const,
      installment: 1,
      totalInstallments: 2,
      paymentEnabled: true,
    };
    const invoice1 = await Invoice.create(invoice1Data);

    const invoice2Data = {
      clientId,
      projectId: project._id,
      number: `F-${String(lastNum + 2).padStart(5, '0')}`,
      description: `${name} — Saldo final 50% (entrega del proyecto)`,
      amount: mitadResto,
      status: 'pendiente' as const,
      issuedAt: new Date(),
      ...(estimatedEndDate ? { dueDate: new Date(estimatedEndDate) } : {}),
      invoiceType: 'saldo_final' as const,
      installment: 2,
      totalInstallments: 2,
      paymentEnabled: false,
      ...(estimatedEndDate ? { enabledAt: new Date(estimatedEndDate) } : {}),
    };
    const invoice2 = await Invoice.create(invoice2Data);

    await Project.updateOne(
      { _id: project._id },
      { invoiceIds: [invoice1._id, invoice2._id] }
    );
  }

  // Notificar al cliente
  const client = await User.findById(clientId).lean();
  if (client) {
    await sendNotification({
      userId: clientId,
      type: 'proyecto',
      title: '¡Nuevo proyecto iniciado!',
      message: budget && budget > 0
        ? `El proyecto "${name}" fue creado. Se generaron 2 cuotas de pago en tu sección de facturación.`
        : `El proyecto "${name}" ha sido creado y ya está en progreso.`,
      link: budget && budget > 0 ? `/dashboard/facturacion` : `/dashboard/proyectos/${project._id}`,
    });

    // Email de proyecto creado
    try {
      await sendEmail({
        to: client.email,
        subject: `VM Studio — Tu proyecto fue iniciado`,
        html: emailProyectoCreado({
          clientName: client.name,
          projectName: project.name,
          projectType: project.type ?? '',
          projectId: project._id.toString(),
        }),
      });
    } catch (emailErr) {
      console.error('[email] emailProyectoCreado:', emailErr);
    }
  }

  return NextResponse.json({ project }, { status: 201 });
}
