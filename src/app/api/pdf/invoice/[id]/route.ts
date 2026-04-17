import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { getAdminFromToken } from '@/lib/helpers/getAdminFromToken'
import { generateInvoicePDF } from '@/lib/pdf/generators/generateInvoicePDF'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar JWT — admins y clientes pueden acceder
    const client = getClientFromToken(req)
    const admin = getAdminFromToken(req)

    if (!client && !admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await dbConnect()

    const invoice = await Invoice.findById(id)
      .populate('clientId', 'name email company phone')
      .lean() as { clientId: { _id: { toString(): string }, name: string, email: string, company?: string, phone?: string }, number: string, description: string, items: { description: string, quantity: number, unitPrice: number, total: number }[], amount: number, status: string, issuedAt: Date, dueDate?: Date, paidAt?: Date, paymentMethod?: string, paymentMethodNew?: string } | null

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // Si es cliente, verificar que sea su factura
    if (client && !admin) {
      if (invoice.clientId._id.toString() !== client.id) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    }

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

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="VM-Factura-${invoice.number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('[GET /api/pdf/invoice/[id]]', err)
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 })
  }
}
