import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Ticket from '@/lib/models/Ticket'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getClientFromToken(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { rating } = await req.json()

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'El rating debe ser entre 1 y 5' }, { status: 400 })
  }

  await dbConnect()

  const ticket = await Ticket.findById(id)
  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
  if (ticket.clientId.toString() !== user.id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  if (ticket.status !== 'resuelto') {
    return NextResponse.json({ error: 'Solo se puede calificar un ticket resuelto' }, { status: 400 })
  }

  ticket.rating = rating
  await ticket.save()

  return NextResponse.json({ ticket })
}
