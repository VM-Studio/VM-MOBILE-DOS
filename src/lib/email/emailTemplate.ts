/**
 * Template base compartido para todos los emails de VM Studio.
 * Diseño: minimalista, tipografía serif con cursiva, dark navy + azul.
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
<body style="margin:0;padding:0;background:#ECEEF1;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ECEEF1;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;background:#ffffff;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background:#0F172A;padding:40px 32px 32px;">
              <img
                src="${LOGO_URL}"
                alt="VM Studio"
                width="52"
                height="52"
                style="display:block;margin:0 auto 18px;border-radius:8px;"
              />
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;letter-spacing:0.3em;color:#94A3B8;text-transform:uppercase;">
                vm studio
              </div>
            </td>
          </tr>

          <!-- ACCENT LINE -->
          <tr>
            <td style="background:#1d4ed8;height:2px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:44px 44px 36px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="border-top:1px solid #E5E7EB;padding:22px 44px;text-align:center;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;color:#9CA3AF;letter-spacing:0.04em;">
                vmstudioweb.online &nbsp;·&nbsp; vmstudio.online@gmail.com
              </p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;font-style:italic;color:#CBD5E1;">
                © ${YEAR} VM Studio — Buenos Aires, Argentina
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
  return `<div style="text-align:center;margin:36px 0 28px;">
    <a href="${href}" style="display:inline-block;background:#0F172A;color:#ffffff;text-decoration:none;padding:14px 40px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;letter-spacing:0.18em;">
      ${label}
    </a>
  </div>`
}

/** Bloque destacado oscuro (totales, montos) */
export function emailDarkBlock(label: string, value: string, note?: string): string {
  return `<div style="background:#0F172A;padding:28px 32px;text-align:center;margin:28px 0;border-left:3px solid #1d4ed8;">
    <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:10px;font-style:italic;color:#64748B;letter-spacing:0.2em;text-transform:uppercase;">${label}</p>
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;color:#ffffff;letter-spacing:0.02em;">${value}</p>
    ${note ? `<p style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;color:#475569;">${note}</p>` : ''}
  </div>`
}

/** Tabla de datos (clave–valor) */
export function emailTable(rows: { label: string; value: string; valueColor?: string }[]): string {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:10px 0;font-family:Georgia,'Times New Roman',serif;font-size:12px;font-style:italic;color:#64748B;border-bottom:1px solid #F1F5F9;">${r.label}</td>
      <td style="padding:10px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:${r.valueColor ?? '#0F172A'};text-align:right;border-bottom:1px solid #F1F5F9;">${r.value}</td>
    </tr>`).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8F0;margin:0 0 28px;">
    <tr><td style="padding:4px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table>
    </td></tr>
  </table>`
}

/** Párrafo de texto estándar */
export function emailP(text: string, small = false): string {
  const size = small ? '12px' : '14px'
  return `<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:${size};color:#374151;line-height:1.8;">${text}</p>`
}

/** Título H2 dentro del contenido */
export function emailH2(text: string): string {
  return `<h2 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;font-style:italic;color:#0F172A;letter-spacing:0.01em;border-bottom:1px solid #E2E8F0;padding-bottom:14px;">${text}</h2>`
}

/** Divider sutil */
export const emailDivider = `<div style="width:100%;height:1px;background:#E2E8F0;margin:28px 0;"></div>`
