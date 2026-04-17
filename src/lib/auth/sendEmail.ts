import nodemailer from 'nodemailer'
import { emailShell, emailBtn, emailTable, emailP, emailH2 } from '@/lib/email/emailTemplate'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000'

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${CLIENT_URL}/api/auth/verify-email/${token}`
  await transporter.sendMail({
    from: `"VM Studio" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verificá tu cuenta — VM Studio',
    html: emailShell(`
      ${emailH2('Verificá tu cuenta')}
      ${emailP('Gracias por registrarte en VM Studio. Hacé clic en el botón de abajo para verificar tu cuenta.')}
      ${emailBtn(link, 'Verificar cuenta')}
      ${emailP('Si no creaste esta cuenta, podés ignorar este email.', true)}
    `),
  })
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${CLIENT_URL}/reset-password/${token}`
  await transporter.sendMail({
    from: `"VM Studio" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Restablecé tu contraseña — VM Studio',
    html: emailShell(`
      ${emailH2('Restablecé tu contraseña')}
      ${emailP('Recibimos una solicitud para restablecer la contraseña de tu cuenta. Este link expira en 1 hora.')}
      ${emailBtn(link, 'Restablecer contraseña')}
      ${emailP('Si no solicitaste este cambio, podés ignorar este email.', true)}
    `),
  })
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: `"VM Studio" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Bienvenido a VM Studio, ${name}`,
    html: emailShell(`
      ${emailH2(`Bienvenido, ${name}`)}
      ${emailP('Tu cuenta fue creada exitosamente. Estamos listos para ayudarte a hacer crecer tu empresa.')}
      ${emailBtn(`${CLIENT_URL}/dashboard`, 'Ir a mi panel')}
    `),
  })
}

// Función genérica para emails — el html ya viene completo (con emailShell aplicado por el caller)
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  await transporter.sendMail({
    from: `"VM Studio" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,  // no wrappear: el html ya incluye emailShell()
  })
}

export async function sendPaymentConfirmationEmail(
  to: string,
  { name, invoiceNumber, amount, method }: { name: string; invoiceNumber: string; amount: number; method: string }
): Promise<void> {
  const methodLabel = method === 'mercadopago' ? 'Mercado Pago' : 'Transferencia bancaria'
  await transporter.sendMail({
    from: `"VM Studio" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Pago confirmado — Factura #${invoiceNumber}`,
    html: emailShell(`
      ${emailH2('Pago confirmado')}
      ${emailP(`Hola ${name}, tu pago fue procesado exitosamente.`)}
      ${emailTable([
        { label: 'Factura', value: `#${invoiceNumber}` },
        { label: 'Monto', value: `$${amount.toLocaleString('es-AR')} ARS`, valueColor: '#16a34a' },
        { label: 'Método', value: methodLabel },
      ])}
      ${emailP('Podés ver el detalle en tu panel de facturación.', true)}
    `),
  })
}
