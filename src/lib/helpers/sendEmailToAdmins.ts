/**
 * lib/helpers/sendEmailToAdmins.ts
 * Envía un email a todos los admins/superadmins activos.
 * Usa Promise.allSettled para que un fallo individual no corte los demás.
 */

import { sendEmail } from '@/lib/auth/sendEmail'
import { getAdminEmails } from './getAdminEmails'

export async function sendEmailToAdmins({
  subject,
  html,
}: {
  subject: string
  html: string
}): Promise<void> {
  try {
    const admins = await getAdminEmails()
    await Promise.allSettled(
      admins.map((admin) =>
        sendEmail({ to: admin.email, subject, html })
      )
    )
  } catch (err) {
    console.error('[email admins] Error:', err)
  }
}
