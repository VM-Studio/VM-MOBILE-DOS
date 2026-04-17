import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Quote from '@/lib/models/Quote'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getClientFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const { id } = await params

    await dbConnect()

    const quote = await Quote.findById(id)
      .select('userId pdfUrl presupuestoNumber status createdAt formData.servicios presupuestoCalculado.total presupuestoCalculado.tiempoEstimado')
      .lean() as {
        userId?: { toString(): string }
        pdfUrl?: string
        presupuestoNumber?: string
        status?: string
        createdAt?: Date
        formData?: { servicios?: string[] }
        presupuestoCalculado?: { total?: number; tiempoEstimado?: { dias: number; label: string } }
      } | null

    if (!quote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado.' }, { status: 404 })
    }

    // Verificar que pertenece al usuario
    if (!quote.userId || quote.userId.toString() !== user.id) {
      return NextResponse.json({ error: 'Sin acceso a este presupuesto.' }, { status: 403 })
    }

    return NextResponse.json({
      presupuesto: {
        presupuestoNumber: quote.presupuestoNumber,
        servicios: quote.formData?.servicios ?? [],
        total: quote.presupuestoCalculado?.total ?? 0,
        tiempoEstimado: quote.presupuestoCalculado?.tiempoEstimado ?? { dias: 0, label: 'A definir' },
        status: quote.status,
        createdAt: quote.createdAt,
        pdfUrl: quote.pdfUrl,
      },
    })
  } catch (err) {
    console.error('[presupuestos/[id]/GET]', err)
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 })
  }
}
