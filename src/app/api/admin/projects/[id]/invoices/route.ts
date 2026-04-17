import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'
import Invoice from '@/lib/models/Invoice'

// GET /api/admin/projects/[id]/invoices — retorna las facturas ligadas a un proyecto
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  const { id } = await params

  const invoices = await Invoice.find({ projectId: id })
    .populate('clientId', 'name email company')
    .sort({ installment: 1 })
    .lean()

  return NextResponse.json({ invoices })
}
