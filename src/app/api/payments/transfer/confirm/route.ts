import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'
import { confirmPayment, triggerSignatureIfFinal } from '@/lib/helpers/processPayment'

export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminFromToken(req)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { invoiceId } = await req.json()
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

    // Detectar el método de pago según lo registrado en la factura
    const method = invoice.paymentMethodNew === 'mercadopago' ? 'mercadopago' : 'transferencia'

    await confirmPayment({
      invoiceId: invoiceId.toString(),
      method,
      processedBy: admin.id,
    })

    // Trigger: si es el saldo final de un proyecto, habilitar firma digital
    await triggerSignatureIfFinal(invoiceId.toString())

    const updated = await Invoice.findById(invoiceId)
    return NextResponse.json({ success: true, invoice: updated })
  } catch (error) {
    console.error('[transfer/confirm] Error:', error)
    return NextResponse.json({ error: 'Error al confirmar transferencia' }, { status: 500 })
  }
}
