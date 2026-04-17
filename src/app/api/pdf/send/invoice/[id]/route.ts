import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'
import { generateInvoicePDF } from '@/lib/pdf/generators/generateInvoicePDF'
import { emailShell, emailBtn, emailDarkBlock, emailTable, emailP, emailH2 } from '@/lib/email/emailTemplate'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
})

type InvoiceLean = {
  clientId: { _id: { toString(): string }, name: string, email: string, company?: string, phone?: string }
  number: string
  description: string
  items: { description: string, quantity: number, unitPrice: number, total: number }[]
  amount: number
  status: string
  issuedAt: Date
  dueDate?: Date
  paidAt?: Date
  paymentMethod?: string
  paymentMethodNew?: string | null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getAdminFromToken(req)
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await dbConnect()

    const invoice = await Invoice.findById(id)
      .populate('clientId', 'name email company phone')
      .lean() as InvoiceLean | null

    if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })

    const pdfBuffer = await generateInvoicePDF({
      invoice: {
        number: invoice.number,
        description: invoice.description,
        items: invoice.items ?? [],
        amount: invoice.amount,
        status: invoice.status,
        issuedAt: invoice.issuedAt,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        paymentMethod: invoice.paymentMethod,
        paymentMethodNew: invoice.paymentMethodNew,
      },
      client: {
        name: invoice.clientId.name,
        email: invoice.clientId.email,
        company: invoice.clientId.company,
        phone: invoice.clientId.phone,
      },
    })

    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000'
    const fmt = (n: number) => '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 0 })
    const fmtDate = (d?: Date | null) =>
      d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

    const statusLabels: Record<string, string> = {
      pendiente: 'Pendiente de pago',
      verificando: 'En verificación',
      pagado: 'Pagado',
      vencido: 'Vencido',
      rechazado: 'Rechazado',
    }

    await transporter.sendMail({
      from: `"VM Studio" <${process.env.EMAIL_USER}>`,
      to: invoice.clientId.email,
      subject: `Tu factura #${invoice.number} — VM Studio`,
      html: emailShell(`
        ${emailH2(`Factura #${invoice.number}`)}
        ${emailP(`Hola ${invoice.clientId.name}, te enviamos la factura correspondiente a tus servicios con VM Studio.`)}
        ${emailDarkBlock('Total a pagar', `${fmt(invoice.amount)} ARS`)}
        ${emailTable([
          { label: 'Número', value: invoice.number },
          { label: 'Fecha de emisión', value: fmtDate(invoice.issuedAt) },
          ...(invoice.dueDate ? [{ label: 'Vencimiento', value: fmtDate(invoice.dueDate), valueColor: '#EF4444' }] : []),
          { label: 'Estado', value: statusLabels[invoice.status] ?? invoice.status },
        ])}
        ${emailBtn(`${clientUrl}/dashboard/facturacion`, 'Pagar ahora')}
        ${emailP('Ante cualquier consulta escribinos a vmstudio.online@gmail.com', true)}
      `),
      attachments: [{
        filename: `VM-Factura-${invoice.number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/pdf/send/invoice/[id]]', err)
    return NextResponse.json({ error: 'Error al enviar la factura' }, { status: 500 })
  }
}
