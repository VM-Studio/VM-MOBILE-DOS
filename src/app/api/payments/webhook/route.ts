import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import { payment } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envía diferentes tipos de notificaciones, solo nos interesan los pagos
    if (body.type !== 'payment') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Obtener los datos del pago desde MP
    const paymentData = await payment.get({ id: paymentId.toString() })

    // Solo procesar pagos aprobados por MP
    if (paymentData.status !== 'approved') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const invoiceId = paymentData.external_reference
    if (!invoiceId) {
      console.error('[webhook] Pago sin external_reference:', paymentId)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    await dbConnect()

    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      console.error('[webhook] Factura no encontrada:', invoiceId)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Idempotencia: si ya está en verificando o pagado, no hacer nada
    if (invoice.status === 'verificando' || invoice.status === 'pagado') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Verificar que el monto coincida (tolerancia $1 para diferencias de redondeo)
    const transactionAmount = paymentData.transaction_amount ?? 0
    if (Math.abs(transactionAmount - invoice.amount) > 1) {
      console.error(
        `[webhook] Monto no coincide. Esperado: ${invoice.amount}, Recibido: ${transactionAmount}`
      )
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Poner en "verificando" para que el admin confirme manualmente
    await Invoice.findByIdAndUpdate(invoiceId, {
      status: 'verificando',
      paymentMethodNew: 'mercadopago',
      mpPaymentId: paymentData.id?.toString(),
      mpStatus: paymentData.status,
      mpStatusDetail: paymentData.status_detail,
      mpPendingAt: new Date(),
    })

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[webhook] Error:', error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
