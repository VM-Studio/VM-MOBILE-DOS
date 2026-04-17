import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await dbConnect()

  const invoice = await Invoice.findById(id)
  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  if (invoice.clientId.toString() !== user.id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  if (invoice.status === 'pagado') {
    return NextResponse.json({ error: 'Esta factura ya fue pagada' }, { status: 400 })
  }

  // Mock payment — real MercadoPago/Stripe integration goes here in Phase 6
  invoice.status = 'pagado'
  invoice.paidAt = new Date()
  invoice.paymentMethod = 'mock'

  await invoice.save()
  return NextResponse.json({ invoice })
}
