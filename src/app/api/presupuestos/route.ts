import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Quote from '@/lib/models/Quote'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'

export async function GET(req: NextRequest) {
  try {
    const user = getClientFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    await dbConnect()

    const quotes = await Quote.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .select(
        'presupuestoNumber formData.servicios presupuestoCalculado.total presupuestoCalculado.tiempoEstimado status createdAt pdfUrl'
      )
      .lean()

    // Nunca devolver items individuales con precios internos
    const safe = quotes.map((q) => {
      const doc = q as {
        _id: unknown
        presupuestoNumber?: string
        formData?: { servicios?: string[] }
        presupuestoCalculado?: {
          total?: number
          tiempoEstimado?: { dias: number; label: string }
        }
        status?: string
        createdAt?: Date
        pdfUrl?: string
      }
      return {
        _id: doc._id,
        presupuestoNumber: doc.presupuestoNumber,
        servicios: doc.formData?.servicios ?? [],
        total: doc.presupuestoCalculado?.total ?? 0,
        tiempoEstimado: doc.presupuestoCalculado?.tiempoEstimado ?? { dias: 0, label: 'A definir' },
        status: doc.status,
        createdAt: doc.createdAt,
        pdfUrl: doc.pdfUrl,
      }
    })

    return NextResponse.json({ presupuestos: safe })
  } catch (err) {
    console.error('[presupuestos/GET]', err)
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 })
  }
}
