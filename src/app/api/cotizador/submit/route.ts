import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Quote from '@/lib/models/Quote'
import User from '@/lib/models/User'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { sendNotification } from '@/lib/helpers/sendNotification'
import { sendEmailToAdmins } from '@/lib/helpers/sendEmailToAdmins'
import { emailShell } from '@/lib/email/emailTemplate'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

const SERVICE_LABELS: Record<string, string> = {
  web_basica: 'Web Básica',
  web_profesional: 'Web Profesional',
  landing: 'Landing Page',
  app_mobile: 'App Mobile',
  app_web: 'App Web',
  sistema_gestion: 'Sistema de Gestión',
  ecommerce: 'Tienda Online (E-Commerce)',
  web: 'Desarrollo Web',
  app: 'Aplicación',
  otro: 'Otro',
}

type ServiceEnum = 'web' | 'app' | 'otro' | 'web_basica' | 'web_profesional' | 'landing' | 'app_mobile' | 'app_web' | 'sistema_gestion' | 'ecommerce'

function mapService(servicio: string): ServiceEnum {
  const valid: ServiceEnum[] = ['web_basica', 'web_profesional', 'landing', 'app_mobile', 'app_web', 'sistema_gestion', 'ecommerce', 'web', 'app', 'otro']
  if (valid.includes(servicio as ServiceEnum)) return servicio as ServiceEnum
  return 'otro'
}

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()

    const datos = body.datos ?? {}

    const nombre = String(body.nombre ?? datos.nombre ?? '').trim()
    const email = String(body.email ?? datos.email ?? '').trim()
    const telefono = String(body.telefono ?? body.whatsapp ?? body.phone ?? datos.whatsapp ?? '').trim()
    const empresa = String(body.empresa ?? datos.empresa ?? '').trim()
    const preferenciaContacto = String(body.preferenciaContacto ?? datos.preferenciaContacto ?? '').trim()
    const quiereContacto: boolean = body.quiereContacto ?? body.wantsContact ?? true

    const servicioSimple: string = body.servicio ?? ''
    const serviciosLegacy: string[] = Array.isArray(body.servicios) ? body.servicios : []
    const servicioFinal = servicioSimple || serviciosLegacy[0] || ''

    if (!nombre || !email) {
      return NextResponse.json(
        { success: false, error: 'Nombre y email son obligatorios.' },
        { status: 400, headers: corsHeaders }
      )
    }
    if (!servicioFinal) {
      return NextResponse.json(
        { success: false, error: 'Seleccioná un servicio.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const year = new Date().getFullYear()
    const last = await Quote.findOne({ presupuestoNumber: { $regex: `^PRES-${year}-` } })
      .sort({ createdAt: -1 })
      .select('presupuestoNumber')
      .lean() as { presupuestoNumber?: string } | null

    let seq = 1
    if (last?.presupuestoNumber) {
      const parts = last.presupuestoNumber.split('-')
      const lastSeq = parseInt(parts[parts.length - 1] ?? '0', 10)
      if (!isNaN(lastSeq)) seq = lastSeq + 1
    }
    const presupuestoNumber = `PRES-${year}-${String(seq).padStart(4, '0')}`

    let userId: string | null = null
    try {
      const user = getClientFromToken(request as NextRequest)
      if (user) userId = user.id
    } catch { /* sin token, ok */ }

    const quote = await Quote.create({
      name: nombre,
      email,
      company: empresa || undefined,
      phone: telefono || undefined,
      service: mapService(servicioFinal),
      status: 'nueva',
      presupuestoNumber,
      userId: userId ?? undefined,
      wantsWhatsapp: preferenciaContacto === 'whatsapp',
      formData: {
        servicio: servicioFinal,
        quiereContacto,
        preferenciaContacto,
        nombre,
        empresa,
        email,
        whatsapp: telefono,
        ...(serviciosLegacy.length > 0 && { servicios: serviciosLegacy }),
      },
      statusHistory: [{ status: 'nueva', changedAt: new Date() }],
    })

    // Notificación in-app a admins
    try {
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id')
      for (const admin of admins) {
        await sendNotification({
          userId: admin._id.toString(),
          type: 'general',
          title: 'Nueva cotización recibida',
          message: `${nombre} solicitó ${SERVICE_LABELS[servicioFinal] ?? servicioFinal}`,
          link: `/admin/cotizaciones/${quote._id}`,
        })
      }
    } catch (notifErr) {
      console.error('[cotizador] Error notificando admins:', notifErr)
    }

    // Email a admins
    try {
      const servicioLabel = SERVICE_LABELS[servicioFinal] ?? servicioFinal
      const contactoPref = preferenciaContacto === 'whatsapp' ? 'WhatsApp' : preferenciaContacto === 'email' ? 'Email' : '—'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.vmstudioweb.online'

      await sendEmailToAdmins({
        subject: `VM Studio — Nueva cotización de ${nombre}`,
        html: emailShell(`
            <p style="margin:0 0 16px;font-size:14px;color:#374151;">
              Un potencial cliente completó el formulario de cotización en vmstudioweb.online.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;margin-bottom:20px;">
              <tr style="background:#0F172A;">
                <td colspan="2" style="padding:10px 16px;color:#fff;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Datos del contacto</td>
              </tr>
              <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;width:40%;">Nombre</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827;font-weight:600;">${nombre}</td>
              </tr>
              <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;">Email</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827;">${email}</td>
              </tr>
              <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;">Teléfono</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827;">${telefono || '—'}</td>
              </tr>
              <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;">Servicio solicitado</td>
                <td style="padding:10px 16px;font-size:14px;color:#1d4ed8;font-weight:700;">${servicioLabel}</td>
              </tr>
              <tr style="border-bottom:1px solid #F3F4F6;">
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;">¿Quiere ser contactado?</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827;">${quiereContacto ? 'Sí' : 'No'}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;">Preferencia de contacto</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827;">${contactoPref}</td>
              </tr>
            </table>
            <a href="${appUrl}/admin/cotizaciones/${quote._id}"
               style="display:inline-block;padding:10px 24px;background:#0F172A;color:#fff;font-size:12px;font-weight:600;letter-spacing:0.1em;text-decoration:none;text-transform:uppercase;">
              VER COTIZACIÓN →
            </a>
          `),
      })
    } catch (e) {
      console.error('[email admin] nueva cotización:', e)
    }

    return NextResponse.json({
      success: true,
      presupuestoNumber,
      quoteId: quote._id.toString(),
    }, { headers: corsHeaders })

  } catch (err) {
    console.error('[cotizador/submit] Error general:', err)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor. Intentá nuevamente.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
