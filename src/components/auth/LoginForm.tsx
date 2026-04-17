'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import useAuth from '@/hooks/useAuth'

interface FieldError {
  email?: string
  password?: string
  general?: string
}

export default function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldError>({})

  const validate = (): boolean => {
    const next: FieldError = {}
    if (!email) next.email = 'El email es requerido.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Email inválido.'
    if (!password) next.password = 'La contraseña es requerida.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      await login(email, password)
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : 'Error al iniciar sesión.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-1.5">
          EMAIL
        </label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className={`w-full px-4 py-3 border rounded text-sm bg-white text-black outline-none focus:border-blue-600 transition-colors ${
            errors.email ? 'border-red-400' : 'border-gray-200'
          }`}
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
      </div>

      {/* Contraseña */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-medium tracking-[0.2em] text-gray-500">
            CONTRASEÑA
          </label>
          <Link href="/forgot-password" className="text-xs text-blue-600">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-3 border rounded text-sm bg-white text-black outline-none focus:border-blue-600 transition-colors pr-10 ${
              errors.password ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
          >
            {showPass ? 'OCULTAR' : 'VER'}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
      </div>

      {/* Botón principal */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        INICIAR SESIÓN
      </button>

      {/* Separador */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[11px] font-medium tracking-[0.15em] text-gray-400">O</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google */}
      <button
        type="button"
        className="w-full py-3 border border-gray-200 rounded text-sm font-medium text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <GoogleIcon />
        CONTINUAR CON GOOGLE
      </button>

      <p className="text-center text-sm text-gray-500">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-blue-600 font-medium">
          Registrate
        </Link>
      </p>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
