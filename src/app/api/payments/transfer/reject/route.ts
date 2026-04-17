import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'
import { rejectTransfer } from '@/lib/helpers/processPayment'

export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminFromToken(req)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { invoiceId, motivo } = await req.json()
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId requerido' }, { status: 400 })
    }

    await dbConnect()

    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    if (invoice.status !== 'verificando') {
      return NextResponse.json(
        { error: `La factura no está en verificación (estado: ${invoice.status})` },
        { status: 400 }
      )
    }

    await rejectTransfer({
      invoiceId: invoiceId.toString(),
      motivo: motivo || 'Comprobante rechazado por el administrador',
      processedBy: admin.id,
    })

    const updated = await Invoice.findById(invoiceId)
    return NextResponse.json({ success: true, invoice: updated })
  } catch (error) {
    console.error('[transfer/reject] Error:', error)
    return NextResponse.json({ error: 'Error al rechazar transferencia' }, { status: 500 })
  }
}
