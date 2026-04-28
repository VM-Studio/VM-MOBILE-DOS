import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken';
import { sendNotification } from '@/lib/helpers/sendNotification';
import Project, { IStage } from '@/lib/models/Project';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/auth/sendEmail';
import { emailEtapaEnRevision, emailArchivoSubido, emailEtapaCompletada, emailProyectoActualizado } from '@/lib/emails/templates';

/** Recalculate progress as the percentage of stages with status 'completado' */
function calcProgress(stages: IStage[]): number {
  if (!stages || stages.length === 0) return 0;
  const done = stages.filter((s) => s.status === 'completado').length;
  return Math.round((done / stages.length) * 100);
}

// GET /api/admin/projects/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();
  const project = await Project.findById(id).populate('clientId', 'name email company phone').lean();
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

  // Recalculate progress from stages
  const total = project.stages?.length ?? 0;
  const done = project.stages?.filter((s) => s.status === 'completado').length ?? 0;
  const computedProgress = total > 0 ? Math.round((done / total) * 100) : project.progress ?? 0;

  return NextResponse.json({ project: { ...project, progress: computedProgress } });
}

// PATCH /api/admin/projects/[id] — editar datos generales
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();

  const body = await req.json();
  // 'progress' is intentionally excluded — it is always recalculated from stages
  const allowed = ['name', 'type', 'status', 'description', 'previewUrl', 'startDate', 'estimatedEndDate', 'completedAt', 'budget', 'stages'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  // Always recalculate progress: either from provided stages or from existing DB stages
  let project = await Project.findById(id);
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

  const stagesToUse = (update.stages as IStage[] | undefined) ?? project.stages;
  update.progress = calcProgress(stagesToUse);

  project = await Project.findByIdAndUpdate(id, update, { new: true });
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

  // Verificar si el proyecto está por finalizar (≤ 7 días)
  if (project.estimatedEndDate) {
    const daysLeft = Math.ceil(
      (new Date(project.estimatedEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft <= 7 && daysLeft > 0) {
      try {
        await sendNotification({
          userId: project.clientId.toString(),
          type: 'proyecto',
          title: 'Tu proyecto está por finalizar',
          message: `El proyecto "${project.name}" finaliza en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`,
          link: `/dashboard/proyectos/${project._id}`,
        })
      } catch { /* notificación opcional */ }
    }
  }

  return NextResponse.json({ project });
}

// DELETE /api/admin/projects/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();
  await Project.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Proyecto eliminado' });
}

// POST /api/admin/projects/[id] — agregar update/archivo/etapa o cambiar etapa
// body: { action: 'add_update' | 'add_file' | 'add_stage' | 'update_stage' | 'remove_file' }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromToken(req);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await dbConnect();

  const body = await req.json();
  const { action } = body;

  const project = await Project.findById(id);
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

  const clientId = project.clientId.toString();

  if (action === 'add_update') {
    const { message, notifyClient } = body;
    project.updates.push({ message, createdAt: new Date() });
    await project.save();

    if (notifyClient) {
      await sendNotification({
        userId: clientId,
        type: 'proyecto',
        title: `Actualización en "${project.name}"`,
        message,
        link: `/dashboard/proyectos/${id}`,
      });
      // Email al cliente
      try {
        const client = await User.findById(clientId).select('email name').lean();
        if (client) {
          await sendEmail({
            to: client.email,
            subject: `VM Studio — Nueva actualización en tu proyecto`,
            html: emailProyectoActualizado({
              clientName: client.name,
              projectName: project.name,
              message,
              projectId: id,
            }),
          });
        }
      } catch { /* email opcional */ }
    }

    return NextResponse.json({ project });
  }

  if (action === 'add_file') {
    const { name, url, category } = body;
    project.files.push({ name, url, category, uploadedAt: new Date() } as typeof project.files[0]);
    await project.save();

    await sendNotification({
      userId: clientId,
      type: 'proyecto',
      title: `Nuevo archivo en "${project.name}"`,
      message: `Se subió un archivo: ${name}`,
      link: `/dashboard/proyectos/${id}`,
    });

    // Email archivo subido
    try {
      const client = await User.findById(clientId).select('email name').lean();
      if (client) {
        await sendEmail({
          to: client.email,
          subject: `VM Studio — Nuevo archivo en tu proyecto`,
          html: emailArchivoSubido({
            clientName: client.name,
            projectName: project.name,
            fileName: name,
            projectId: id,
          }),
        });
      }
    } catch (emailErr) {
      console.error('[email] emailArchivoSubido:', emailErr);
    }

    return NextResponse.json({ project });
  }

  if (action === 'remove_file') {
    const { fileId } = body;
    project.files = project.files.filter((f) => f._id.toString() !== fileId) as typeof project.files;
    await project.save();
    return NextResponse.json({ project });
  }

  if (action === 'add_stage') {
    const { name, description, order, requiresApproval } = body;
    const newOrder = order ?? project.stages.length + 1;
    project.stages.push({
      name,
      description,
      order: newOrder,
      status: 'pendiente',
      requiresApproval: requiresApproval ?? false,
    } as typeof project.stages[0]);
    project.progress = calcProgress(project.stages);
    await project.save();
    return NextResponse.json({ project });
  }

  if (action === 'update_stage') {
    const { stageId, status, description, requiresApproval } = body;
    const stage = project.stages.find((s) => s._id.toString() === stageId);
    if (!stage) return NextResponse.json({ error: 'Etapa no encontrada' }, { status: 404 });

    if (status) stage.status = status;
    if (description !== undefined) stage.description = description;
    if (requiresApproval !== undefined) stage.requiresApproval = requiresApproval;

    if (status === 'completado') {
      stage.completedAt = new Date();
      await sendNotification({
        userId: clientId,
        type: 'proyecto',
        title: `Etapa completada`,
        message: `La etapa "${stage.name}" del proyecto "${project.name}" fue completada.`,
        link: `/dashboard/proyectos/${id}`,
      });
      // Email etapa completada
      try {
        const client = await User.findById(clientId).select('email name').lean();
        if (client) {
          await sendEmail({
            to: client.email,
            subject: `VM Studio — Etapa completada en tu proyecto`,
            html: emailEtapaCompletada({
              clientName: client.name,
              projectName: project.name,
              stageName: stage.name,
              projectId: id,
            }),
          });
        }
      } catch { /* email opcional */ }
    }

    if (status === 'en_revision') {
      stage.completedAt = new Date();
      await sendNotification({
        userId: clientId,
        type: 'proyecto',
        title: `Etapa lista para revisión`,
        message: `La etapa "${stage.name}" del proyecto "${project.name}" está lista para que la revises.`,
        link: `/dashboard/proyectos/${id}`,
      });

      // Email etapa en revisión
      try {
        const client = await User.findById(clientId).select('email name').lean();
        if (client) {
          await sendEmail({
            to: client.email,
            subject: `VM Studio — Etapa lista para revisar`,
            html: emailEtapaEnRevision({
              clientName: client.name,
              projectName: project.name,
              stageName: stage.name,
              projectId: id,
            }),
          });
        }
      } catch (emailErr) {
        console.error('[email] emailEtapaEnRevision:', emailErr);
      }
    }

    project.progress = calcProgress(project.stages);
    await project.save();
    return NextResponse.json({ project });
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
}
