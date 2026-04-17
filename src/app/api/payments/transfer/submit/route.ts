import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import User from '@/lib/models/User'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { sendNotification } from '@/lib/helpers/sendNotification'
import { triggerSignatureIfFinal } from '@/lib/helpers/processPayment'
import { sendEmailToAdmins } from '@/lib/helpers/sendEmailToAdmins'
import { emailAdminComprobanteRecibido } from '@/lib/emails/templates'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    const client = await getClientFromToken(req)
    if (!client) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const invoiceId = formData.get('invoiceId') as string
    const file = formData.get('comprobante') as File | null

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId requerido' }, { status: 400 })
    }

    await dbConnect()

    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    if (invoice.clientId.toString() !== client.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (invoice.status !== 'pendiente') {
      return NextResponse.json(
        { error: `La factura no está pendiente (estado: ${invoice.status})` },
        { status: 400 }
      )
    }

    let comprobanteUrl: string | null = null
    let comprobanteName: string | null = null

    if (file) {
      // Validar tipo de archivo
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Tipo de archivo no permitido. Use JPG, PNG, WEBP o PDF.' },
          { status: 400 }
        )
      }

      // Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'El archivo no puede superar 5MB' },
          { status: 400 }
        )
      }

      // Guardar como data URL base64 directamente en MongoDB
      // (evita depender del filesystem, que es read-only en Vercel)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      comprobanteUrl = `data:${file.type};base64,${base64}`
      comprobanteName = file.name
    }

    // Actualizar la factura
    invoice.status = 'verificando'
    invoice.paymentMethodNew = 'transferencia'
    invoice.transferEnviadoAt = new Date()
    if (comprobanteUrl) invoice.transferComprobante = comprobanteUrl
    if (comprobanteName) invoice.transferComprobanteNombre = comprobanteName

    await invoice.save()

    // Notificar a todos los admins
    const admins = await User.find({ role: 'admin' }).select('_id')
    for (const admin of admins) {
      await sendNotification({
        userId: admin._id.toString(),
        type: 'factura',
        title: '🔵 Comprobante de pago recibido',
        message: `El cliente envió un comprobante para la factura #${invoice.number}`,
        link: '/admin/facturacion',
      })
    }

    // Trigger: si es el saldo final de un proyecto, habilitar firma digital inmediatamente
    const signatureProjectId = await triggerSignatureIfFinal(invoiceId.toString())

    // Email a todos los admins sobre el comprobante recibido
    try {
      const clientDoc = await User.findById(client.id).select('name').lean() as { name?: string } | null
      const clientName = clientDoc?.name ?? client.email
      await sendEmailToAdmins({
        subject: `VM Studio — ${clientName} envió comprobante`,
        html: emailAdminComprobanteRecibido({
          clientName,
          invoiceNumber: invoice.number,
          amount: invoice.amount,
          invoiceId: invoice._id.toString(),
        }),
      })
    } catch (e) { console.error('[email admin] comprobante:', e) }

    return NextResponse.json({ success: true, invoice, signatureProjectId })
  } catch (error) {
    console.error('[transfer/submit] Error:', error)
    return NextResponse.json({ error: 'Error al enviar comprobante' }, { status: 500 })
  }
}
