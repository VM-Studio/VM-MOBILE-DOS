/**
 * Template base compartido para todos los emails de VM Studio.
 * Diseño: elegante, minimalista, colores del home (dark navy + blue gradient).
 * El logo se sirve desde la URL pública del dominio.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.CLIENT_URL ?? 'https://app.vmstudioweb.online'
const LOGO_URL = `${APP_URL}/icons/icon-128x128.png`
const YEAR = new Date().getFullYear()

/**
 * Envuelve el contenido en el shell completo del email:
 * logo centrado → contenido → footer.
 */
export function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VM Studio</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #E5E7EB;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#0F172A 0%,#1e3a5f 60%,#1d4ed8 100%);padding:36px 32px 28px;">
              <img
                src="${LOGO_URL}"
                alt="VM Studio"
                width="64"
                height="64"
                style="display:block;margin:0 auto 16px;border-radius:12px;border:2px solid rgba(255,255,255,0.15);"
              />
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:0.12em;color:#ffffff;">
                VM <span style="color:#60a5fa;font-weight:300;">Studio</span>
              </div>
              <div style="width:40px;height:1px;background:rgba(96,165,250,0.5);margin:10px auto 0;"></div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:12px;color:#9CA3AF;letter-spacing:0.05em;">
                vmstudioweb.online &nbsp;·&nbsp; vmstudio.online@gmail.com
              </p>
              <p style="margin:0;font-size:11px;color:#D1D5DB;font-family:Arial,sans-serif;">
                © ${YEAR} VM Studio. Buenos Aires, Argentina.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Botón CTA principal */
export function emailBtn(href: string, label: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#111827 0%,#1d4ed8 100%);color:#ffffff;text-decoration:none;padding:14px 36px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">
      ${label}
    </a>
  </div>`
}

/** Bloque destacado oscuro (totales, montos) */
export function emailDarkBlock(label: string, value: string, note?: string): string {
  return `<div style="background:#0F172A;padding:28px 32px;text-align:center;margin:24px 0;">
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:0.2em;">${label}</p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:0.02em;">${value}</p>
    ${note ? `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#4B5563;">${note}</p>` : ''}
  </div>`
}

/** Tabla de datos (clave–valor) */
export function emailTable(rows: { label: string; value: string; valueColor?: string }[]): string {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${r.label}</td>
      <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:${r.valueColor ?? '#111827'};text-align:right;border-bottom:1px solid #F3F4F6;">${r.value}</td>
    </tr>`).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F9FAFB;border:1px solid #E5E7EB;padding:0;margin:0 0 24px;">
    <tr><td style="padding:4px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table>
    </td></tr>
  </table>`
}

/** Párrafo de texto estándar */
export function emailP(text: string, small = false): string {
  const size = small ? '12px' : '14px'
  return `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:${size};color:#374151;line-height:1.7;">${text}</p>`
}

/** Título H2 dentro del contenido */
export function emailH2(text: string): string {
  return `<h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#0F172A;letter-spacing:0.02em;">${text}</h2>`
}

/** Divider sutil */
export const emailDivider = `<div style="width:100%;height:1px;background:#E5E7EB;margin:24px 0;"></div>`
