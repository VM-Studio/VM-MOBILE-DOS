'use client'

import { useState, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { resetPassword } from '@/services/authService'

export default function ResetPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; general?: string }>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!password || password.length < 8) next.password = 'Mínimo 8 caracteres.'
    if (password !== confirmPassword) next.confirmPassword = 'Las contraseñas no coinciden.'
    if (Object.keys(next).length > 0) { setErrors(next); return }

    setLoading(true)
    setErrors({})
    try {
      await resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => router.push('/login?reset=true'), 2500)
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : 'Error al restablecer.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Contraseña actualizada</h2>
          <p className="text-sm text-gray-500">Redirigiendo al inicio de sesión…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 pt-12 pb-16">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <span className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-3">
          [ NUEVA CONTRASEÑA ]
        </span>
        <h1 className="text-2xl font-light text-black mb-6">
          Creá tu nueva <span className="font-semibold">contraseña</span>
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.15em] text-gray-700 mb-1">
              NUEVA CONTRASEÑA
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 border rounded text-sm outline-none focus:border-blue-600 pr-10 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.15em] text-gray-700 mb-1">
              CONFIRMAR CONTRASEÑA
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 border rounded text-sm outline-none focus:border-blue-600 ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold tracking-[0.1em] rounded hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            ACTUALIZAR CONTRASEÑA
          </button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
