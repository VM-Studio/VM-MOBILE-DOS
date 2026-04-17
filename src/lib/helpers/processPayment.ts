import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import Project from '@/lib/models/Project'
import User from '@/lib/models/User'
import { sendNotification } from '@/lib/helpers/sendNotification'

interface ConfirmPaymentParams {
  invoiceId: string
  method: 'mercadopago' | 'transferencia'
  mpPaymentId?: string
  processedBy?: string
}

interface RejectTransferParams {
  invoiceId: string
  motivo: string
  processedBy: string
}

/**
 * Confirma el pago de una factura.
 * Actualiza la factura, notifica al cliente por in-app y push.
 */
export async function confirmPayment({ invoiceId, method, mpPaymentId, processedBy }: ConfirmPaymentParams) {
  await dbConnect()

  const invoice = await Invoice.findById(invoiceId)
  if (!invoice) throw new Error(`Factura ${invoiceId} no encontrada`)

  // Idempotencia: no procesar si ya está pagada
  if (invoice.status === 'pagado') return invoice

  invoice.status = 'pagado'
  invoice.paymentMethodNew = method
  invoice.paidAt = new Date()
  invoice.processedAt = new Date()
  if (mpPaymentId) invoice.mpPaymentId = mpPaymentId
  if (processedBy) invoice.processedBy = processedBy as unknown as import('mongoose').Types.ObjectId
  if (method === 'transferencia') invoice.transferConfirmadoAt = new Date()

  await invoice.save()

  // Notificación in-app al cliente
  await sendNotification({
    userId: invoice.clientId.toString(),
    type: 'factura',
    title: 'Pago confirmado',
    message: `Tu pago de $${invoice.amount.toLocaleString('es-AR')} fue confirmado exitosamente.`,
    link: '/dashboard/facturacion',
  })

  // Email al cliente (opcional, no falla si no está configurado)
  try {
    const client = await User.findById(invoice.clientId).select('email name').lean()
    if (client) {
      const { sendPaymentConfirmationEmail } = await import('@/lib/auth/sendEmail')
      await sendPaymentConfirmationEmail(client.email, {
        name: client.name,
        invoiceNumber: invoice.number,
        amount: invoice.amount,
        method,
      })
    }
  } catch {
    // El email es opcional, no bloquea el flujo
  }

  return invoice
}

/**
 * Rechaza el comprobante de transferencia de una factura.
 * Vuelve la factura a 'pendiente' para que el cliente pueda pagar de nuevo.
 */
export async function rejectTransfer({ invoiceId, motivo, processedBy }: RejectTransferParams) {
  await dbConnect()

  const invoice = await Invoice.findById(invoiceId)
  if (!invoice) throw new Error(`Factura ${invoiceId} no encontrada`)

  invoice.status = 'pendiente'
  invoice.transferRechazadoAt = new Date()
  invoice.transferMotivoRechazo = motivo
  invoice.transferComprobante = null
  invoice.transferComprobanteNombre = null
  invoice.processedBy = processedBy as unknown as import('mongoose').Types.ObjectId
  invoice.processedAt = new Date()

  await invoice.save()

  // Notificación in-app al cliente
  await sendNotification({
    userId: invoice.clientId.toString(),
    type: 'factura',
    title: 'Comprobante rechazado',
    message: `Tu comprobante fue rechazado. Motivo: ${motivo}`,
    link: '/dashboard/facturacion',
  })

  return invoice
}

/**
 * Trigger post-pago: si la factura está vinculada a un proyecto,
 * y el proyecto NO tiene firma pendiente ni firmada aún, activa awaitingSignature.
 * Llamar DESPUÉS de guardar la factura (submit) o confirmar el pago.
 * Funciona con cualquier invoiceType ('saldo_final', 'manual', etc.)
 * siempre que la factura tenga projectId.
 */
export async function triggerSignatureIfFinal(invoiceId: string): Promise<string | null> {
  try {
    await dbConnect()
    const invoice = await Invoice.findById(invoiceId).lean()
    if (!invoice) {
      console.log('[triggerSignatureIfFinal] Factura no encontrada:', invoiceId)
      return null
    }

    if (!invoice.projectId) {
      console.log('[triggerSignatureIfFinal] Factura sin projectId, skip:', invoiceId)
      return null
    }

    if (invoice.invoiceType === 'anticipo') {
      console.log('[triggerSignatureIfFinal] Es anticipo, skip:', invoiceId)
      return null
    }

    const project = await Project.findById(invoice.projectId)
    if (!project) {
      console.log('[triggerSignatureIfFinal] Proyecto no encontrado:', invoice.projectId)
      return null
    }

    if (project.awaitingSignature) {
      console.log('[triggerSignatureIfFinal] Ya awaitingSignature, devolviendo projectId igual')
      return project._id.toString()
    }
    if (project.closingSignature?.signedAt) {
      console.log('[triggerSignatureIfFinal] Ya firmado, skip')
      return null
    }

    const adminUser = await User.findOne({
      role: { $in: ['admin', 'superadmin'] },
      signatureData: { $exists: true, $ne: null },
    }).lean()

    console.log('[triggerSignatureIfFinal] Activando firma para proyecto:', project._id.toString(), '| admin con firma:', adminUser ? adminUser.name : 'ninguno')

    await Project.updateOne(
      { _id: project._id },
      {
        awaitingSignature: true,
        'closingSignature.adminSignatureData': adminUser?.signatureData ?? null,
        'closingSignature.adminName': adminUser?.name ?? 'VM Studio',
        'closingSignature.signedByAdmin': adminUser?._id ?? null,
      }
    )

    await sendNotification({
      userId: invoice.clientId.toString(),
      type: 'proyecto',
      title: 'Documento listo para firmar',
      message: 'Tu proyecto está completo. Firmá el documento de cierre para recibir tu certificado.',
      link: `/dashboard/firmar/${project._id.toString()}`,
    })

    console.log('[triggerSignatureIfFinal] ✅ awaitingSignature activado para proyecto:', project._id.toString())
    return project._id.toString()
  } catch (err) {
    console.error('[triggerSignatureIfFinal] Error:', err)
    return null
  }
}
