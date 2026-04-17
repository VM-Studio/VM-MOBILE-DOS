import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { sendNotification } from '@/lib/helpers/sendNotification'

export async function GET(req: NextRequest) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  const invoices = await Invoice.find({ clientId: user.id }).sort({ issuedAt: -1 }).lean()

  const now = new Date()

  // Habilitar automáticamente las facturas cuya fecha de habilitación llegó
  for (const invoice of invoices) {
    if (
      !invoice.paymentEnabled &&
      invoice.enabledAt &&
      now >= new Date(invoice.enabledAt)
    ) {
      await Invoice.updateOne({ _id: invoice._id }, { paymentEnabled: true })
      invoice.paymentEnabled = true

      await sendNotification({
        userId: user.id,
        type: 'factura',
        title: 'Segunda cuota disponible',
        message: `Ya podés abonar el saldo final de tu proyecto`,
        link: '/dashboard/facturacion',
      })
    }
  }

  const totalPagado = invoices
    .filter((i) => i.status === 'pagado')
    .reduce((acc, i) => acc + i.amount, 0)

  const totalPendiente = invoices
    .filter((i) => i.status === 'pendiente')
    .reduce((acc, i) => acc + i.amount, 0)

  const proximoVencimiento = invoices
    .filter((i) => i.status === 'pendiente' && i.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]?.dueDate ?? null

  return NextResponse.json({ invoices, summary: { totalPagado, totalPendiente, proximoVencimiento } })
}
