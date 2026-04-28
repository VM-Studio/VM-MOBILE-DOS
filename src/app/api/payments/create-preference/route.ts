import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import User from '@/lib/models/User'
import { preference } from '@/lib/mercadopago'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import type { PreferenceRequest } from 'mercadopago/dist/clients/preference/commonTypes'

export async function POST(req: NextRequest) {
  try {
    const client = await getClientFromToken(req)
    if (!client) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { invoiceId, amount: requestedAmount } = await req.json()
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId requerido' }, { status: 400 })
    }

    await dbConnect()

    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // Verificar que la factura pertenece al cliente autenticado
    if (invoice.clientId.toString() !== client.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Solo se puede pagar una factura pendiente
    if (invoice.status !== 'pendiente') {
      return NextResponse.json(
        { error: `La factura no está pendiente (estado actual: ${invoice.status})` },
        { status: 400 }
      )
    }

    const user = await User.findById(client.id).select('email name')
    // NEXT_PUBLIC_APP_URL → variable manual (máxima prioridad)
    // VERCEL_PROJECT_PRODUCTION_URL → dominio de producción fijo (Vercel lo inyecta automáticamente)
    // VERCEL_URL → URL del deployment actual (Vercel, cambia por preview deploy)
    // Fallback → localhost para desarrollo
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'

    // Solo enviamos notification_url y auto_return si es una URL pública (no localhost)
    const isPublicUrl = appUrl.startsWith('https://')
    const backUrlBase = `${appUrl}/dashboard/facturacion`

    const preferenceBody: PreferenceRequest = {
      items: [
        {
          id: invoice._id.toString(),
          title: invoice.description || `Factura #${invoice.number}`,
          quantity: 1,
          unit_price: requestedAmount ? Number(requestedAmount) : Number(invoice.amount),
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: user?.email || '',
        name: user?.name || '',
      },
      back_urls: {
        success: `${backUrlBase}?payment=success&invoice=${invoiceId}`,
        failure: `${backUrlBase}?payment=failure&invoice=${invoiceId}`,
        pending: `${backUrlBase}?payment=pending&invoice=${invoiceId}`,
      },
      // auto_return solo funciona con URLs públicas (no localhost)
      ...(isPublicUrl ? { auto_return: 'approved' as const } : {}),
      external_reference: invoiceId,
      ...(isPublicUrl ? { notification_url: `${appUrl}/api/payments/webhook` } : {}),
      statement_descriptor: 'VM STUDIO',
    }

    const result = await preference.create({ body: preferenceBody })

    // Guardar el preferenceId en la factura
    invoice.mpPreferenceId = result.id ?? null
    invoice.paymentMethodNew = 'mercadopago'
    await invoice.save()

    return NextResponse.json({
      preferenceId: result.id,
      initPoint: result.init_point,
    })
  } catch (error) {
    console.error('[create-preference] Error:', error)
    return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 500 })
  }
}
