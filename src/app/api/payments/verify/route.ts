import { NextRequest, NextResponse } from 'next/server'
import { payment } from '@/lib/mercadopago'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'

/**
 * POST /api/payments/verify
 * Consulta la API de MercadoPago con el payment_id que llega en la back_url
 * (?payment_id=...) y, si el pago está aprobado, pone la factura en
 * "verificando" para que el admin la confirme manualmente.
 */
export async function POST(req: NextRequest) {
  try {
    const client = getClientFromToken(req)
    if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { paymentId, invoiceId } = await req.json()
    if (!paymentId || !invoiceId) {
      return NextResponse.json({ error: 'paymentId e invoiceId son requeridos' }, { status: 400 })
    }

    await dbConnect()

    // Verificar que la factura pertenece al cliente autenticado
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    if (invoice.clientId.toString() !== client.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Si ya está en verificando o pagado, devolver OK directamente (idempotencia)
    if (invoice.status === 'verificando' || invoice.status === 'pagado') {
      return NextResponse.json({ status: invoice.status })
    }

    // Consultar el estado del pago en MercadoPago
    const paymentData = await payment.get({ id: paymentId.toString() })

    if (paymentData.status !== 'approved') {
      return NextResponse.json({ status: paymentData.status ?? 'pending' })
    }

    // Verificar que el external_reference coincide con el invoiceId (seguridad)
    if (paymentData.external_reference && paymentData.external_reference !== invoiceId) {
      return NextResponse.json({ error: 'Referencia de pago no coincide' }, { status: 400 })
    }

    // Poner en "verificando" para revisión manual del admin
    await Invoice.findByIdAndUpdate(invoiceId, {
      status: 'verificando',
      paymentMethodNew: 'mercadopago',
      mpPaymentId: paymentData.id?.toString(),
      mpStatus: paymentData.status,
      mpStatusDetail: paymentData.status_detail,
      mpPendingAt: new Date(),
    })

    return NextResponse.json({ status: 'verificando' })
  } catch (error) {
    console.error('[verify-payment] Error:', error)
    return NextResponse.json({ error: 'Error al verificar pago' }, { status: 500 })
  }
}
