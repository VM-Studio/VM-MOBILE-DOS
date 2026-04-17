import type { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Recuperar Acceso',
}

export default function ForgotPasswordPage() {
  return (
    <>
      <span className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-3">
        [ RECUPERAR ACCESO ]
      </span>
      <h1 className="text-2xl font-light text-black mb-2">
        ¿Olvidaste tu <span className="font-semibold">contraseña?</span>
      </h1>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Ingresá tu email y te enviamos un link para restablecer tu contraseña.
      </p>
      <ForgotPasswordForm />
    </>
  )
}
