import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect()
    const { token } = await params

    const user = await User.findOne({ verificationToken: token })
    if (!user) {
      redirect('/login?error=token-invalido')
    }

    user.isVerified = true
    user.verificationToken = undefined
    await user.save()

    redirect('/login?verified=true')
  } catch (error) {
    console.error('[VERIFY-EMAIL]', error)
    redirect('/login?error=error-verificacion')
  }
}
