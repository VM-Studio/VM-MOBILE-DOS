import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import User from '@/lib/models/User'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { sendNotification } from '@/lib/helpers/sendNotification'
import { sendEmail } from '@/lib/auth/sendEmail'
import { emailSegundaCuotaDisponible } from '@/lib/emails/templates'

export async function GET(req: NextRequest) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()

  const invoices = await Invoice.find({ clientId: user.id }).sort({ issuedAt: -1 }).lean()

  const now = new Date()

  // Identify invoices that need to be auto-enabled in one pass
  const toEnable = invoices.filter(
    (inv) => !inv.paymentEnabled && inv.enabledAt && now >= new Date(inv.enabledAt)
  )

  if (toEnable.length > 0) {
    // Single bulk write instead of one updateOne per invoice
    await Invoice.updateMany(
      { _id: { $in: toEnable.map((i) => i._id) } },
      { paymentEnabled: true }
    )
    // Update local array so the response is accurate
    for (const inv of toEnable) inv.paymentEnabled = true

    // Send notifications in parallel instead of sequentially
    await Promise.all(
      toEnable.map(() =>
        sendNotification({
          userId: user.id,
          type: 'factura',
          title: 'Segunda cuota disponible',
          message: `Ya podés abonar el saldo final de tu proyecto`,
          link: '/dashboard/facturacion',
        })
      )
    )
    // Email segunda cuota
    try {
      const clientDoc = await User.findById(user.id).select('email name').lean()
      if (clientDoc && toEnable.length > 0) {
        const inv = toEnable[0]
        await sendEmail({
          to: clientDoc.email,
          subject: `VM Studio — Segunda cuota disponible`,
          html: emailSegundaCuotaDisponible({
            clientName: clientDoc.name,
            projectName: 'tu proyecto',
            amount: inv.amount,
          }),
        })
      }
    } catch { /* email opcional */ }
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
