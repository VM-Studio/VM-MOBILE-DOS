import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import nodemailer from 'nodemailer'
import dbConnect from '@/lib/db'
import Quote from '@/lib/models/Quote'
import User from '@/lib/models/User'
import { getClientFromToken } from '@/lib/helpers/getClientFromToken'
import { calcularPresupuesto } from '@/lib/cotizador/calcularPresupuesto'
import { generatePresupuestoPDF } from '@/lib/pdf/generators/generatePresupuestoPDF'
import { sendNotification } from '@/lib/helpers/sendNotification'
import { emailShell, emailBtn, emailDarkBlock, emailP, emailH2 } from '@/lib/email/emailTemplate'
import { sendEmailToAdmins } from '@/lib/helpers/sendEmailToAdmins'
import { emailAdminNuevaCotizacion } from '@/lib/emails/templates'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://vmstudioweb.online',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
})

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()

    const servicios: string[] = Array.isArray(body.servicios) ? body.servicios : []
    const web = body.web ?? {}
    const app = body.app ?? {}
    const general = body.general ?? {}
    const datos = body.datos ?? {}

    const nombre = String(datos.nombre ?? '').trim()
    const email = String(datos.email ?? '').trim()
    const whatsapp = String(datos.whatsapp ?? '').trim()
    const empresa = String(datos.empresa ?? '').trim()
    const preferenciaContacto = String(datos.preferenciaContacto ?? '').trim()

    if (!nombre || !email || !whatsapp) {
      return NextResponse.json(
        { success: false, error: 'Nombre, email y WhatsApp son obligatorios.' },
        { status: 400, headers: corsHeaders }
      )
    }
    if (servicios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Seleccioná al menos un servicio.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const resultado = calcularPresupuesto({ servicios, web, app, general, datos })

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

    const fecha = new Date()
    const validoHasta = new Date(fecha)
    validoHasta.setDate(validoHasta.getDate() + 30)

    let pdfBuffer: Buffer
    let pdfUrl: string

    try {
      pdfBuffer = await generatePresupuestoPDF({
        presupuestoNumber,
        fecha,
        validoHasta,
        cliente: { nombre, empresa, email, whatsapp },
        servicios: resultado.items.map(i => i.descripcion),
        total: resultado.total,
        tiempoEstimado: resultado.tiempoEstimado,
      })
      const pdfDir = path.join(process.cwd(), 'public', 'presupuestos')
      await fs.mkdir(pdfDir, { recursive: true })
      const pdfFileName = `${presupuestoNumber}.pdf`
      await fs.writeFile(path.join(pdfDir, pdfFileName), pdfBuffer)
      pdfUrl = `/presupuestos/${pdfFileName}`
    } catch (pdfErr) {
      console.error('[cotizador] Error generando PDF:', pdfErr)
      pdfBuffer = Buffer.from('')
      pdfUrl = ''
    }

    const primaryService = servicios.includes('web') ? 'web'
      : servicios.includes('app') ? 'app'
      : 'otro'

    const quote = await Quote.create({
      name: nombre,
      email,
      company: empresa,
      phone: whatsapp,
      service: primaryService,
      status: 'nueva',
      presupuestoNumber,
      userId: userId ?? undefined,
      pdfUrl,
      pdfGeneradoAt: fecha,
      wantsWhatsapp: preferenciaContacto === 'whatsapp',
      formData: {
        servicios,
        webTipo: web.tipo, webPaginas: web.paginas, webContacto: web.contacto ?? [], webExtras: web.extras ?? [],
        appTipo: app.tipo, appRubro: app.rubro, appExtras: app.extras ?? [],
        etapaNegocio: general.etapa, tieneWeb: general.tieneWeb, urlWebActual: general.urlWeb, cuandoEmpezar: general.cuandoEmpezar, comoNosConocio: general.comoNosConocio,
        nombre, empresa, email, whatsapp, preferenciaContacto,
      },
      presupuestoCalculado: {
        items: resultado.items, subtotal: resultado.subtotal, descuento: resultado.descuento,
        total: resultado.total, tiempoEstimado: resultado.tiempoEstimado,
      },
      statusHistory: [{ status: 'nueva', changedAt: new Date() }],
    })

    try {
      const fmt = (n: number) => `$${n.toLocaleString('es-AR')} ARS`
      const serviciosList = resultado.items
        .map(s => `<li style="margin-bottom:6px;color:#374151;font-size:14px">${s.descripcion}</li>`)
        .join('')
      await transporter.sendMail({
        from: `"VM Studio" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Tu presupuesto de VM Studio — ${presupuestoNumber}`,
        html: emailShell(`
          ${emailH2(`Hola, ${nombre}`)}
          ${emailP('Preparamos una estimación personalizada para tu proyecto:')}
          <ul style="padding-left:20px;margin:0 0 20px">${serviciosList}</ul>
          ${emailDarkBlock('Inversión estimada', `DESDE ${fmt(resultado.total)}`)}
          ${emailP(`Tiempo estimado: ${resultado.tiempoEstimado.label}`)}
          ${emailP('Nuestro equipo te contactará en <strong>menos de 24 horas</strong>.')}
          ${emailBtn('https://vmstudioweb.online', 'Ver casos de estudio')}
        `),
        attachments: pdfBuffer.length > 0
          ? [{ filename: `VM-Presupuesto-${presupuestoNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
          : [],
      })
    } catch (emailErr) {
      console.error('[cotizador] Error enviando email:', emailErr)
    }

    try {
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id')
      for (const admin of admins) {
        await sendNotification({
          userId: admin._id.toString(),
          type: 'general',
          title: 'Nueva cotización recibida',
          message: `${nombre}${empresa ? ` de ${empresa}` : ''} solicitó presupuesto`,
          link: '/admin/cotizaciones',
        })
        // Los admins no tienen suscripción push — solo clientes reciben push
      }
    } catch (notifErr) {
      console.error('[cotizador] Error notificando admins:', notifErr)
    }

    // Email a todos los admins sobre la nueva cotización
    try {
      const serviciosLegibles = resultado.items.map((i: { descripcion: string }) => i.descripcion)
      await sendEmailToAdmins({
        subject: `VM Studio — Nueva cotización de ${nombre}`,
        html: emailAdminNuevaCotizacion({
          clientName: nombre,
          clientEmail: email,
          clientPhone: whatsapp,
          servicios: serviciosLegibles,
          presupuestoNumber,
          quoteId: quote._id.toString(),
        }),
      })
    } catch (e) { console.error('[email admin] nueva cotización:', e) }

    return NextResponse.json({
      success: true,
      presupuestoNumber,
      total: resultado.total,
      tiempoEstimado: resultado.tiempoEstimado,
      pdfUrl,
    }, { headers: corsHeaders })

  } catch (err) {
    console.error('[cotizador/submit] Error general:', err)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor. Intentá nuevamente.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
