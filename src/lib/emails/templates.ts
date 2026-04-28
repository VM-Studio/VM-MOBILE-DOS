/**
 * lib/emails/templates.ts
 * Templates de email para VM Studio.
 * Usa el sistema existente: emailShell, emailBtn, emailP, emailH2, emailTable, emailDarkBlock
 * de lib/email/emailTemplate.ts — NO duplica el transporter ni el diseño.
 */

import {
  emailShell,
  emailBtn,
  emailP,
  emailH2,
  emailTable,
  emailDarkBlock,
  emailDivider,
} from '@/lib/email/emailTemplate'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.vmstudioweb.online'

// ── 1. PROYECTO CREADO ───────────────────────────────────────────────────
export function emailProyectoCreado({
  clientName,
  projectName,
  projectType,
  projectId,
}: {
  clientName: string
  projectName: string
  projectType: string
  projectId: string
}): string {
  return emailShell(`
    ${emailH2('¡Tu proyecto fue iniciado!')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('El equipo de VM Studio comenzó a trabajar en tu proyecto.')}
    ${emailTable([
      { label: 'Proyecto', value: projectName },
      { label: 'Tipo', value: projectType ?? '' },
    ])}
    ${emailP('Podés seguir el avance en tiempo real desde tu panel.')}
    ${emailBtn(`${APP_URL}/dashboard/proyectos/${projectId}`, 'VER MI PROYECTO')}
  `)
}

// ── 2. ETAPA EN REVISIÓN ─────────────────────────────────────────────────
export function emailEtapaEnRevision({
  clientName,
  projectName,
  stageName,
  projectId,
}: {
  clientName: string
  projectName: string
  stageName: string
  projectId: string
}): string {
  return emailShell(`
    ${emailH2('Una etapa está lista para tu revisión')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('El equipo completó una etapa y necesita tu aprobación para continuar.')}
    ${emailTable([
      { label: 'Etapa', value: stageName },
      { label: 'Proyecto', value: projectName },
    ])}
    ${emailP('Ingresá a tu panel para aprobar o solicitar cambios.')}
    ${emailBtn(`${APP_URL}/dashboard/proyectos/${projectId}`, 'REVISAR AHORA')}
  `)
}

// ── 3. ARCHIVO SUBIDO ────────────────────────────────────────────────────
export function emailArchivoSubido({
  clientName,
  projectName,
  fileName,
  projectId,
}: {
  clientName: string
  projectName: string
  fileName: string
  projectId: string
}): string {
  return emailShell(`
    ${emailH2('Nuevo archivo en tu proyecto')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('El equipo subió un nuevo archivo a tu proyecto.')}
    ${emailTable([
      { label: 'Archivo', value: fileName },
      { label: 'Proyecto', value: projectName },
    ])}
    ${emailP('Ingresá para verlo y descargarlo.')}
    ${emailBtn(`${APP_URL}/dashboard/proyectos/${projectId}`, 'VER ARCHIVO')}
  `)
}

// ── 4. NUEVO AVANCE (PREVIEW / DEPLOY) ──────────────────────────────────
export function emailNuevoAvance({
  clientName,
  projectName,
  deployMessage,
  projectId,
}: {
  clientName: string
  projectName: string
  deployMessage: string
  projectId: string
}): string {
  return emailShell(`
    ${emailH2('Nuevo avance en tu proyecto')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('El equipo actualizó el avance de tu proyecto.')}
    ${emailTable([
      { label: 'Proyecto', value: projectName },
      { label: 'Mensaje', value: deployMessage },
    ])}
    ${emailP('Ingresá para ver cómo va quedando tu sitio.')}
    ${emailBtn(`${APP_URL}/dashboard/proyectos/${projectId}`, 'VER AVANCE')}
  `)
}

// ── 6. FACTURA CREADA ────────────────────────────────────────────────────
export function emailFacturaCreada({
  clientName,
  invoiceNumber,
  description,
  amount,
  dueDate,
}: {
  clientName: string
  invoiceNumber: string
  description: string
  amount: number
  dueDate?: Date | null
}): string {
  const fecha = dueDate
    ? new Date(dueDate).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'A definir'

  const rows = [
    { label: 'Factura', value: invoiceNumber },
    { label: 'Descripción', value: description },
    {
      label: 'Monto',
      value: `$${amount.toLocaleString('es-AR')} ARS`,
      valueColor: '#0F172A',
    },
    { label: 'Vencimiento', value: fecha, valueColor: '#DC2626' },
  ]

  return emailShell(`
    ${emailH2('Tenés una nueva factura')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('Se generó una nueva factura para tu cuenta.')}
    ${emailTable(rows)}
    ${emailP('Podés pagar con MercadoPago o transferencia bancaria desde tu panel.')}
    ${emailBtn(`${APP_URL}/dashboard/facturacion`, 'PAGAR AHORA')}
  `)
}

// ── 7. PAGO CONFIRMADO ───────────────────────────────────────────────────
// (Ya existe sendPaymentConfirmationEmail en lib/auth/sendEmail.ts — este
//  alias permite importar desde un único lugar si se prefiere)
export function emailPagoConfirmado({
  clientName,
  invoiceNumber,
  amount,
  paymentMethod,
}: {
  clientName: string
  invoiceNumber: string
  amount: number
  paymentMethod: string
}): string {
  const metodo =
    paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Transferencia bancaria'
  return emailShell(`
    ${emailH2('¡Pago confirmado!')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('Tu pago fue confirmado exitosamente.')}
    ${emailDarkBlock(
      'PAGO CONFIRMADO ✓',
      `$${amount.toLocaleString('es-AR')} ARS`,
      `Factura ${invoiceNumber} · ${metodo}`
    )}
    ${emailP('Podés ver el comprobante en tu sección de facturación.')}
    ${emailBtn(`${APP_URL}/dashboard/facturacion`, 'VER FACTURACIÓN')}
  `)
}

// ── 8. SEGUNDA CUOTA DISPONIBLE ──────────────────────────────────────────
export function emailSegundaCuotaDisponible({
  clientName,
  projectName,
  amount,
}: {
  clientName: string
  projectName: string
  amount: number
}): string {
  return emailShell(`
    ${emailH2('La segunda cuota ya está disponible')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('Tu proyecto está llegando a su fin. La segunda cuota ya está habilitada para pagar.')}
    ${emailDarkBlock(
      'SALDO FINAL — CUOTA 2 DE 2',
      `$${amount.toLocaleString('es-AR')} ARS`,
      projectName
    )}
    ${emailP('Una vez abonado el saldo final, tu proyecto estará listo para el cierre formal.')}
    ${emailBtn(`${APP_URL}/dashboard/facturacion`, 'PAGAR SALDO FINAL')}
  `)
}

// ── 9. NUEVO MENSAJE DEL EQUIPO ──────────────────────────────────────────
export function emailNuevoMensaje({
  clientName,
  roomName,
  messagePreview,
}: {
  clientName: string
  roomName: string
  messagePreview: string
}): string {
  const preview =
    messagePreview.length > 120
      ? messagePreview.substring(0, 120) + '...'
      : messagePreview

  return emailShell(`
    ${emailH2('Nuevo mensaje de VM Studio')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('Recibiste un nuevo mensaje del equipo.')}
    ${emailTable([
      { label: 'Sala', value: roomName },
      { label: 'Mensaje', value: `"${preview}"` },
    ])}
    ${emailDivider}
    ${emailP('Respondé directamente desde tu panel.', true)}
    ${emailBtn(`${APP_URL}/dashboard/mensajes`, 'VER MENSAJE')}
  `)
}

// ── 10. TICKET RESPONDIDO ────────────────────────────────────────────────
export function emailTicketRespondido({
  clientName,
  ticketNumber,
  ticketTitle,
  ticketId,
}: {
  clientName: string
  ticketNumber: string
  ticketTitle: string
  ticketId: string
}): string {
  return emailShell(`
    ${emailH2('Respondieron tu ticket de soporte')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('El equipo de VM Studio respondió tu ticket.')}
    ${emailTable([
      { label: 'N°', value: ticketNumber },
      { label: 'Ticket', value: ticketTitle },
    ])}
    ${emailP('Ingresá para ver la respuesta y continuar la conversación.')}
    ${emailBtn(`${APP_URL}/dashboard/soporte/${ticketId}`, 'VER RESPUESTA')}
  `)
}

// ── 11. TICKET RESUELTO ──────────────────────────────────────────────────
export function emailTicketResuelto({
  clientName,
  ticketNumber,
  ticketTitle,
}: {
  clientName: string
  ticketNumber: string
  ticketTitle: string
}): string {
  return emailShell(`
    ${emailH2('Tu ticket fue resuelto ✓')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('Tu ticket de soporte fue marcado como resuelto.')}
    ${emailTable([
      { label: 'N°', value: ticketNumber, valueColor: '#16A34A' },
      { label: 'Ticket', value: ticketTitle },
    ])}
    ${emailP('Si el problema persiste podés abrir un nuevo ticket desde tu panel.', true)}
    ${emailBtn(`${APP_URL}/dashboard/soporte`, 'IR AL SOPORTE')}
  `)
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAILS PARA ADMINS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper interno: genera un email con estructura estándar para admins.
 * No se exporta — solo lo usan las funciones de este archivo.
 */
function baseTemplate({
  titulo,
  contenido,
  ctaTexto,
  ctaUrl,
  pieTexto,
}: {
  titulo: string
  contenido: string
  ctaTexto: string
  ctaUrl: string
  pieTexto?: string
}): string {
  return emailShell(`
    ${emailH2(titulo)}
    ${contenido}
    ${emailBtn(ctaUrl, ctaTexto)}
    ${pieTexto ? emailP(pieTexto, true) : ''}
  `)
}

// ── 1. CLIENTE ENVIÓ UN MENSAJE ──────────────────────────────────────────
export function emailAdminNuevoMensaje({
  clientName,
  clientEmail,
  roomName,
  messagePreview,
}: {
  clientName: string
  clientEmail: string
  roomName: string
  messagePreview: string
  clientId: string
}): string {
  const preview = messagePreview.substring(0, 150) + (messagePreview.length > 150 ? '...' : '')
  return baseTemplate({
    titulo: `Nuevo mensaje de ${clientName}`,
    contenido: `
      <p>Un cliente envió un mensaje y está esperando respuesta.</p>
      <br/>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 16px; background: #F8FAFC;
            border-left: 3px solid #2563EB;">
            <p style="margin: 0 0 4px 0; font-size: 12px;
              color: #6B7280; text-transform: uppercase;
              letter-spacing: 1px;">${roomName}</p>
            <p style="margin: 0 0 8px 0; font-size: 15px;
              color: #374151; font-style: italic;">
              &ldquo;${preview}&rdquo;
            </p>
            <p style="margin: 0; font-size: 13px; color: #6B7280;">
              <strong style="color: #0F172A;">${clientName}</strong>
              &nbsp;&middot;&nbsp; ${clientEmail}
            </p>
          </td>
        </tr>
      </table>
    `,
    ctaTexto: 'RESPONDER MENSAJE',
    ctaUrl: `${APP_URL}/admin/mensajes`,
    pieTexto: 'Respondé a la brevedad para mantener una buena comunicación con el cliente.',
  })
}

// ── 2. CLIENTE APROBÓ UNA ETAPA ──────────────────────────────────────────
export function emailAdminEtapaAprobada({
  clientName,
  projectName,
  stageName,
  projectId,
}: {
  clientName: string
  projectName: string
  stageName: string
  projectId: string
}): string {
  return baseTemplate({
    titulo: `${clientName} aprobó una etapa`,
    contenido: `
      <p>El cliente aprobó una etapa del proyecto.
        Podés continuar con la siguiente.</p>
      <br/>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 16px; background: #DCFCE7;
            border-left: 3px solid #16A34A;">
            <p style="margin: 0 0 4px 0; font-size: 13px;
              color: #15803D; font-weight: 600;">
              APROBADA ✓
            </p>
            <p style="margin: 0; font-size: 18px; font-weight: 700;
              color: #0F172A;">${stageName}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;
              color: #6B7280;">${projectName} &middot; ${clientName}</p>
          </td>
        </tr>
      </table>
    `,
    ctaTexto: 'VER PROYECTO',
    ctaUrl: `${APP_URL}/admin/proyectos/${projectId}`,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES ADICIONALES — CLIENTE
// ═══════════════════════════════════════════════════════════════════════════

// ── FIRMA DE CIERRE SOLICITADA ────────────────────────────────────────────
export function emailFirmaCierreRequerida({
  clientName,
  projectName,
  projectId,
}: {
  clientName: string
  projectName: string
  projectId: string
}): string {
  return emailShell(`
    ${emailH2('Tu proyecto está listo para firmar')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('El equipo de VM Studio completó tu proyecto. Para finalizarlo oficialmente, necesitamos tu firma digital en el documento de cierre.')}
    ${emailTable([{ label: 'Proyecto', value: projectName }])}
    ${emailP('El proceso toma menos de 1 minuto desde tu panel.')}
    ${emailBtn(`${APP_URL}/dashboard/proyectos/${projectId}`, 'FIRMAR DOCUMENTO DE CIERRE')}
    ${emailP('Una vez firmado, recibirás tu certificado de entrega en formato PDF.', true)}
  `)
}

// ── COMPROBANTE RECHAZADO ─────────────────────────────────────────────────
export function emailComprobanteRechazado({
  clientName,
  invoiceNumber,
  amount,
  motivo,
}: {
  clientName: string
  invoiceNumber: string
  amount: number
  motivo: string
}): string {
  return emailShell(`
    ${emailH2('Comprobante de pago rechazado')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('Revisamos el comprobante de transferencia que enviaste y no pudimos confirmarlo.')}
    ${emailTable([
      { label: 'Factura', value: invoiceNumber },
      { label: 'Monto', value: `$${amount.toLocaleString('es-AR')} ARS` },
      { label: 'Motivo', value: motivo, valueColor: '#DC2626' },
    ])}
    ${emailP('Por favor, volvé a intentarlo con un comprobante válido o contactanos si tenés alguna duda.')}
    ${emailBtn(`${APP_URL}/dashboard/facturacion`, 'IR A FACTURACIÓN')}
  `)
}

// ── MANTENIMIENTO APROBADO ────────────────────────────────────────────────
export function emailMantenimientoAprobado({
  clientName,
  projectName,
  tipo,
  proximoCobro,
}: {
  clientName: string
  projectName: string
  tipo: string
  proximoCobro: string
}): string {
  const tipoLabel = tipo === 'mensual_recurrente' ? 'Mensual recurrente' : 'Puntual'
  return emailShell(`
    ${emailH2('¡Mantenimiento aprobado!')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('Tu solicitud de mantenimiento fue aprobada por el equipo de VM Studio.')}
    ${emailTable([
      { label: 'Proyecto', value: projectName },
      { label: 'Tipo', value: tipoLabel },
      { label: 'Próximo cobro', value: proximoCobro, valueColor: '#0F172A' },
    ])}
    ${emailP('Podés ver el detalle y el estado de tu mantenimiento desde tu panel.')}
    ${emailBtn(`${APP_URL}/dashboard/mantenimiento`, 'VER MANTENIMIENTO')}
  `)
}

// ── MANTENIMIENTO PAUSADO ─────────────────────────────────────────────────
export function emailMantenimientoPausado({
  clientName,
  projectName,
}: {
  clientName: string
  projectName: string
}): string {
  return emailShell(`
    ${emailH2('Mantenimiento pausado temporalmente')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('Tu servicio de mantenimiento fue pausado temporalmente.')}
    ${emailTable([{ label: 'Proyecto', value: projectName }])}
    ${emailP('Contactanos si tenés alguna consulta o si querés reactivarlo.')}
    ${emailBtn(`${APP_URL}/dashboard/mantenimiento`, 'VER MANTENIMIENTO')}
  `)
}

// ── MANTENIMIENTO REANUDADO ───────────────────────────────────────────────
export function emailMantenimientoReanudado({
  clientName,
  projectName,
}: {
  clientName: string
  projectName: string
}): string {
  return emailShell(`
    ${emailH2('Mantenimiento reanudado ✓')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('Buenas noticias: tu servicio de mantenimiento fue reanudado y está activo nuevamente.')}
    ${emailTable([{ label: 'Proyecto', value: projectName }])}
    ${emailBtn(`${APP_URL}/dashboard/mantenimiento`, 'VER MANTENIMIENTO')}
  `)
}

// ── ETAPA COMPLETADA ──────────────────────────────────────────────────────
export function emailEtapaCompletada({
  clientName,
  projectName,
  stageName,
  projectId,
}: {
  clientName: string
  projectName: string
  stageName: string
  projectId: string
}): string {
  return emailShell(`
    ${emailH2('Una etapa fue completada ✓')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('El equipo de VM Studio completó una etapa de tu proyecto.')}
    ${emailTable([
      { label: 'Etapa completada', value: stageName, valueColor: '#16A34A' },
      { label: 'Proyecto', value: projectName },
    ])}
    ${emailP('Seguí el avance general de tu proyecto desde tu panel.')}
    ${emailBtn(`${APP_URL}/dashboard/proyectos/${projectId}`, 'VER MI PROYECTO')}
  `)
}

// ── ACTUALIZACIÓN EN EL PROYECTO ──────────────────────────────────────────
export function emailProyectoActualizado({
  clientName,
  projectName,
  message,
  projectId,
}: {
  clientName: string
  projectName: string
  message: string
  projectId: string
}): string {
  const preview = message.length > 200 ? message.substring(0, 200) + '...' : message
  return emailShell(`
    ${emailH2('Actualización en tu proyecto')}
    ${emailP(`Hola <strong>${clientName}</strong>,`)}
    ${emailP('El equipo de VM Studio publicó una nueva actualización en tu proyecto.')}
    ${emailTable([
      { label: 'Proyecto', value: projectName },
      { label: 'Novedad', value: `"${preview}"` },
    ])}
    ${emailBtn(`${APP_URL}/dashboard/proyectos/${projectId}`, 'VER ACTUALIZACIÓN')}
  `)
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES ADICIONALES — ADMINS
// ═══════════════════════════════════════════════════════════════════════════

// ── ADMIN: NUEVA SOLICITUD DE MANTENIMIENTO ───────────────────────────────
export function emailAdminSolicitudMantenimiento({
  clientName,
  clientEmail,
  projectName,
  tipo,
  notaCliente,
}: {
  clientName: string
  clientEmail: string
  projectName: string
  tipo: string
  notaCliente?: string
}): string {
  const tipoLabel = tipo === 'mensual_recurrente' ? 'Mensual recurrente' : 'Puntual'
  return baseTemplate({
    titulo: `Nueva solicitud de mantenimiento`,
    contenido: `
      <p>${clientName} solicitó un servicio de mantenimiento para su proyecto.</p>
      <br/>
      <table width="100%" cellpadding="12" cellspacing="0" style="border: 1px solid #E5E7EB;">
        <tr style="background: #0F172A;">
          <td colspan="2" style="padding: 12px 16px;">
            <p style="margin: 0; color: #93C5FD; font-size: 12px; letter-spacing: 2px;">SOLICITUD DE MANTENIMIENTO</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #6B7280; font-size: 13px; width: 35%;">Cliente</td>
          <td style="padding: 12px 16px; color: #0F172A; font-size: 14px; font-weight: 600;">${clientName}</td>
        </tr>
        <tr style="background: #F8FAFC;">
          <td style="padding: 12px 16px; color: #6B7280; font-size: 13px;">Email</td>
          <td style="padding: 12px 16px;"><a href="mailto:${clientEmail}" style="color: #2563EB; font-size: 14px;">${clientEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #6B7280; font-size: 13px;">Proyecto</td>
          <td style="padding: 12px 16px; color: #0F172A; font-size: 14px;">${projectName}</td>
        </tr>
        <tr style="background: #F8FAFC;">
          <td style="padding: 12px 16px; color: #6B7280; font-size: 13px;">Tipo</td>
          <td style="padding: 12px 16px; color: #0F172A; font-size: 14px; font-weight: 600;">${tipoLabel}</td>
        </tr>
        ${notaCliente ? `<tr>
          <td style="padding: 12px 16px; color: #6B7280; font-size: 13px;">Nota</td>
          <td style="padding: 12px 16px; color: #374151; font-size: 14px; font-style: italic;">"${notaCliente}"</td>
        </tr>` : ''}
      </table>
    `,
    ctaTexto: 'VER MANTENIMIENTOS',
    ctaUrl: `${APP_URL}/admin/mantenimientos`,
    pieTexto: 'Revisá la solicitud y aprobala o rechazala desde el panel de administración.',
  })
}

// ── ADMIN: CLIENTE RESPONDIÓ EN UN TICKET ────────────────────────────────
export function emailAdminClienteRespondiTicket({
  clientName,
  clientEmail,
  ticketNumber,
  ticketTitle,
  messagePreview,
  ticketId,
}: {
  clientName: string
  clientEmail: string
  ticketNumber: string
  ticketTitle: string
  messagePreview: string
  ticketId: string
}): string {
  const preview = messagePreview.substring(0, 150) + (messagePreview.length > 150 ? '...' : '')
  return baseTemplate({
    titulo: `${clientName} respondió en un ticket`,
    contenido: `
      <p>Un cliente agregó un nuevo mensaje en un ticket de soporte.</p>
      <br/>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 16px; background: #F8FAFC; border-left: 3px solid #2563EB;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">${ticketNumber} — ${ticketTitle}</p>
            <p style="margin: 0 0 8px 0; font-size: 15px; color: #374151; font-style: italic;">&ldquo;${preview}&rdquo;</p>
            <p style="margin: 0; font-size: 13px; color: #6B7280;">
              <strong style="color: #0F172A;">${clientName}</strong>
              &nbsp;&middot;&nbsp; ${clientEmail}
            </p>
          </td>
        </tr>
      </table>
    `,
    ctaTexto: 'VER TICKET',
    ctaUrl: `${APP_URL}/admin/soporte/${ticketId}`,
    pieTexto: 'Respondé a la brevedad para mantener una buena atención al cliente.',
  })
}
// ── 3. CLIENTE RECHAZÓ UNA ETAPA ─────────────────────────────────────────
export function emailAdminEtapaRechazada({
  clientName,
  projectName,
  stageName,
  rejectionComment,
  projectId,
}: {
  clientName: string
  projectName: string
  stageName: string
  rejectionComment: string
  projectId: string
}): string {
  return baseTemplate({
    titulo: `${clientName} rechazó una etapa`,
    contenido: `
      <p>El cliente rechazó una etapa y dejó un comentario.
        Revisá el feedback y realizá los ajustes necesarios.</p>
      <br/>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 16px; background: #FEE2E2;
            border-left: 3px solid #DC2626;">
            <p style="margin: 0 0 4px 0; font-size: 13px;
              color: #DC2626; font-weight: 600;">
              RECHAZADA ✕
            </p>
            <p style="margin: 0; font-size: 18px; font-weight: 700;
              color: #0F172A;">${stageName}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;
              color: #6B7280;">${projectName} &middot; ${clientName}</p>
          </td>
        </tr>
      </table>
      <br/>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 16px; background: #F8FAFC;
            border-left: 3px solid #6B7280;">
            <p style="margin: 0 0 4px 0; font-size: 12px;
              color: #6B7280; text-transform: uppercase;
              letter-spacing: 1px;">MOTIVO DEL RECHAZO</p>
            <p style="margin: 0; font-size: 15px;
              color: #374151; font-style: italic;">
              &ldquo;${rejectionComment}&rdquo;
            </p>
          </td>
        </tr>
      </table>
    `,
    ctaTexto: 'VER PROYECTO',
    ctaUrl: `${APP_URL}/admin/proyectos/${projectId}`,
    pieTexto: 'Realizá los ajustes y volvé a marcar la etapa como "En revisión".',
  })
}

// ── 4. CLIENTE ENVIÓ COMPROBANTE ──────────────────────────────────────────
export function emailAdminComprobanteRecibido({
  clientName,
  invoiceNumber,
  amount,
}: {
  clientName: string
  invoiceNumber: string
  amount: number
  invoiceId: string
}): string {
  const monto = amount.toLocaleString('es-AR')
  return baseTemplate({
    titulo: `${clientName} envió un comprobante`,
    contenido: `
      <p>Un cliente envió el comprobante de transferencia
        y está esperando confirmación.</p>
      <br/>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 16px; background: #FEF9C3;
            border-left: 3px solid #CA8A04;">
            <p style="margin: 0 0 4px 0; font-size: 13px;
              color: #92400E; font-weight: 600;">
              PENDIENTE DE VERIFICACIÓN
            </p>
            <p style="margin: 0; font-size: 22px; font-weight: 700;
              color: #0F172A;">$${monto} ARS</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;
              color: #6B7280;">
              Factura ${invoiceNumber} &middot; ${clientName}
            </p>
          </td>
        </tr>
      </table>
      <br/>
      <p>Verificá el comprobante y confirmá o rechazá
        el pago desde el panel de facturación.</p>
    `,
    ctaTexto: 'VERIFICAR COMPROBANTE',
    ctaUrl: `${APP_URL}/admin/facturacion`,
    pieTexto: 'El cliente está esperando la confirmación.',
  })
}

// ── 5. CLIENTE CREÓ UN TICKET ─────────────────────────────────────────────
export function emailAdminNuevoTicket({
  clientName,
  ticketNumber,
  ticketTitle,
  category,
  priority,
  ticketId,
}: {
  clientName: string
  ticketNumber: string
  ticketTitle: string
  category: string
  priority: string
  ticketId: string
}): string {
  const priorityColor =
    ({ alta: '#DC2626', media: '#CA8A04', baja: '#16A34A' } as Record<string, string>)[priority] ?? '#6B7280'

  return baseTemplate({
    titulo: 'Nuevo ticket de soporte',
    contenido: `
      <p>${clientName} abrió un nuevo ticket de soporte
        que requiere atención.</p>
      <br/>
      <table width="100%" cellpadding="12" cellspacing="0"
        style="border: 1px solid #E5E7EB;">
        <tr style="background: #0F172A;">
          <td colspan="2" style="padding: 12px 16px;">
            <p style="margin: 0; color: #93C5FD; font-size: 12px;
              letter-spacing: 2px;">${ticketNumber}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #6B7280;
            font-size: 13px; width: 30%;">Asunto</td>
          <td style="padding: 12px 16px; color: #0F172A;
            font-size: 14px; font-weight: 600;">
            ${ticketTitle}
          </td>
        </tr>
        <tr style="background: #F8FAFC;">
          <td style="padding: 12px 16px; color: #6B7280;
            font-size: 13px;">Cliente</td>
          <td style="padding: 12px 16px; color: #0F172A;
            font-size: 14px;">${clientName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #6B7280;
            font-size: 13px;">Categoría</td>
          <td style="padding: 12px 16px; color: #0F172A;
            font-size: 14px; text-transform: capitalize;">
            ${category}
          </td>
        </tr>
        <tr style="background: #F8FAFC;">
          <td style="padding: 12px 16px; color: #6B7280;
            font-size: 13px;">Prioridad</td>
          <td style="padding: 12px 16px; font-size: 14px;
            font-weight: 700; color: ${priorityColor};
            text-transform: uppercase;">${priority}</td>
        </tr>
      </table>
    `,
    ctaTexto: 'RESPONDER TICKET',
    ctaUrl: `${APP_URL}/admin/soporte/${ticketId}`,
    pieTexto: 'Respondé a la brevedad según la prioridad del ticket.',
  })
}

// ── 6. NUEVA COTIZACIÓN DEL FORMULARIO ───────────────────────────────────
export function emailAdminNuevaCotizacion({
  clientName,
  clientEmail,
  clientPhone,
  servicios,
  presupuestoNumber,
  quoteId,
}: {
  clientName: string
  clientEmail: string
  clientPhone: string
  servicios: string[]
  presupuestoNumber: string
  quoteId: string
}): string {
  return baseTemplate({
    titulo: 'Nueva cotización recibida',
    contenido: `
      <p>Un potencial cliente completó el formulario
        de cotización en vmstudioweb.online.</p>
      <br/>
      <table width="100%" cellpadding="12" cellspacing="0"
        style="border: 1px solid #E5E7EB;">
        <tr style="background: #0F172A;">
          <td colspan="2" style="padding: 12px 16px;">
            <p style="margin: 0; color: #93C5FD; font-size: 12px;
              letter-spacing: 2px;">${presupuestoNumber}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #6B7280;
            font-size: 13px; width: 30%;">Nombre</td>
          <td style="padding: 12px 16px; color: #0F172A;
            font-size: 14px; font-weight: 600;">${clientName}</td>
        </tr>
        <tr style="background: #F8FAFC;">
          <td style="padding: 12px 16px; color: #6B7280;
            font-size: 13px;">Email</td>
          <td style="padding: 12px 16px;">
            <a href="mailto:${clientEmail}"
              style="color: #2563EB; font-size: 14px;">
              ${clientEmail}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #6B7280;
            font-size: 13px;">WhatsApp</td>
          <td style="padding: 12px 16px;">
            <a href="https://wa.me/${clientPhone}"
              style="color: #16A34A; font-size: 14px;
              font-weight: 600;">
              +${clientPhone}
            </a>
          </td>
        </tr>
        <tr style="background: #F8FAFC;">
          <td style="padding: 12px 16px; color: #6B7280;
            font-size: 13px;">Servicios</td>
          <td style="padding: 12px 16px; color: #0F172A;
            font-size: 14px;">
            ${servicios.join(' &middot; ')}
          </td>
        </tr>
      </table>
      <br/>
      <p>Contactalo a la brevedad para cerrar la venta.</p>
    `,
    ctaTexto: 'VER COTIZACIÓN',
    ctaUrl: `${APP_URL}/admin/cotizaciones/${quoteId}`,
    pieTexto: 'Las primeras 24 horas son clave para convertir una cotización.',
  })
}

// ── 7. CLIENTE FIRMÓ EL CIERRE ────────────────────────────────────────────
export function emailAdminProyectoCerrado({
  clientName,
  projectName,
  projectId,
}: {
  clientName: string
  projectName: string
  projectId: string
}): string {
  return baseTemplate({
    titulo: 'Proyecto cerrado con firma digital',
    contenido: `
      <p>${clientName} firmó el documento de cierre
        del proyecto.</p>
      <br/>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 20px; background: #DCFCE7;
            border-left: 3px solid #16A34A; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 13px;
              color: #15803D; font-weight: 600;">
              PROYECTO CERRADO ✓
            </p>
            <p style="margin: 0; font-size: 20px; font-weight: 700;
              color: #0F172A;">${projectName}</p>
            <p style="margin: 6px 0 0 0; font-size: 13px;
              color: #6B7280;">Firmado por ${clientName}</p>
          </td>
        </tr>
      </table>
      <br/>
      <p>El certificado de cierre está disponible
        en el detalle del proyecto.</p>
    `,
    ctaTexto: 'VER PROYECTO',
    ctaUrl: `${APP_URL}/admin/proyectos/${projectId}`,
  })
}
