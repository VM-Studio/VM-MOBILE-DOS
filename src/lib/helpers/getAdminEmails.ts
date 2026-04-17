/**
 * lib/helpers/getAdminEmails.ts
 * Obtiene los emails de todos los admins activos.
 * Se usa en todos los emails que van al equipo.
 */

import connectDB from '@/lib/db'
import User from '@/lib/models/User'

export async function getAdminEmails(): Promise<{ email: string; name: string }[]> {
  await connectDB()
  const admins = await User.find({
    role: { $in: ['admin', 'superadmin'] },
    isActive: true,
  })
    .select('email name')
    .lean()

  return (admins as { email: string; name: string }[]).map((a) => ({
    email: a.email,
    name: a.name,
  }))
}
