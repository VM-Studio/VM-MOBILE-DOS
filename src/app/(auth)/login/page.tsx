import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
}

export default function LoginPage() {
  return (
    <>
      <span className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-3">
        [ INICIAR SESIÓN ]
      </span>
      <h1 className="text-2xl font-light text-black mb-6">
        Bienvenido de <span className="font-semibold">vuelta</span>
      </h1>
      <LoginForm />
    </>
  )
}
