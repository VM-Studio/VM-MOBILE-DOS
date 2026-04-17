'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, Check } from 'lucide-react'
import { forgotPassword } from '@/services/authService'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Ingresa tu email'); return }
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar el email'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 border border-blue-200 mb-4">
          <Check size={28} className="text-blue-600" />
        </div>
        <p className="text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-2">[ EMAIL ENVIADO ]</p>
        <h2 className="text-2xl font-light text-gray-900 mb-3">Revisa tu bandeja</h2>
        <p className="text-sm text-gray-500 font-light mb-6">
          Enviamos las instrucciones a{' '}
          <span className="font-medium text-gray-700">{email}</span>.
          El link expira en 1 hora.
        </p>
        <Link href="/login" className="text-blue-600 text-sm font-medium hover:underline">
          ← Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <p className="text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-1">[ RECUPERAR ACCESO ]</p>
        <h1 className="text-2xl font-light text-gray-900">
          ¿Olvidaste tu <span className="font-medium">contraseña?</span>
        </h1>
        <p className="text-sm text-gray-500 font-light mt-2">
          Ingresa tu email y te enviamos un link para restablecerla.
        </p>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 rounded px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-1">EMAIL</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full border border-gray-200 rounded px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-medium rounded px-4 py-3 text-sm tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'ENVIANDO...' : 'ENVIAR LINK'}
      </button>

      <p className="text-center text-sm text-gray-500 font-light">
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </form>
  )
}
