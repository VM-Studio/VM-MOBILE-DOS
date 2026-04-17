'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import useAuth from '@/hooks/useAuth'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  terms?: string
  general?: string
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte']
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500']
  return { score, label: labels[score], color: colors[score] }
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      {ok ? <Check size={12} /> : <X size={12} />}
      <span>{text}</span>
    </div>
  )
}

export default function RegisterForm() {
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [terms, setTerms] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  const strength = getStrength(password)

  function validate(): boolean {
    const e: FieldErrors = {}
    if (!name.trim()) e.name = 'El nombre es obligatorio'
    if (!email.trim()) e.email = 'El email es obligatorio'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido'
    if (!password) e.password = 'La contraseña es obligatoria'
    else if (password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (password !== confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden'
    if (!terms) e.terms = 'Debes aceptar los términos'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      await register({ name, email, password, company: company || undefined })
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la cuenta'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 border border-green-200 mb-4">
          <Check size={28} className="text-green-600" />
        </div>
        <p className="text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-2">[ CUENTA CREADA ]</p>
        <h2 className="text-2xl font-light text-gray-900 mb-3">Revisa tu email</h2>
        <p className="text-sm text-gray-500 font-light mb-6">
          Enviamos un link de verificación a <span className="font-medium text-gray-700">{email}</span>
        </p>
        <Link href="/login" className="text-blue-600 text-sm font-medium hover:underline">
          Ir al inicio de sesión →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <p className="text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-1">[ CREAR CUENTA ]</p>
        <h1 className="text-2xl font-light text-gray-900">
          Únete a <span className="font-medium">VM Studio</span>
        </h1>
      </div>

      {errors.general && (
        <div className="border border-red-200 bg-red-50 rounded px-4 py-3 text-sm text-red-600">
          {errors.general}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-1">NOMBRE</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tu nombre completo"
          className={`w-full border rounded px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:ring-1 focus:ring-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
        />
        {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Empresa (opcional) */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-1">EMPRESA <span className="normal-case font-normal tracking-normal">(opcional)</span></label>
        <input
          type="text"
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="Nombre de tu empresa"
          className="w-full border border-gray-200 rounded px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-1">EMAIL</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className={`w-full border rounded px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:ring-1 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
        />
        {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-1">CONTRASEÑA</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className={`w-full border rounded px-4 py-3 pr-12 text-sm text-gray-900 bg-white outline-none focus:ring-1 focus:ring-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-200'}`}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
        {password && (
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1 h-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`flex-1 rounded-full ${i < strength.score ? strength.color : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className="text-[11px] text-gray-500">{strength.label}</p>
            <div className="grid grid-cols-2 gap-1">
              <Rule ok={password.length >= 8} text="8 caracteres" />
              <Rule ok={/[A-Z]/.test(password)} text="Mayúscula" />
              <Rule ok={/[0-9]/.test(password)} text="Número" />
              <Rule ok={/[^A-Za-z0-9]/.test(password)} text="Símbolo" />
            </div>
          </div>
        )}
      </div>

      {/* Confirmar contraseña */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.2em] text-gray-500 mb-1">CONFIRMAR CONTRASEÑA</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            className={`w-full border rounded px-4 py-3 pr-12 text-sm text-gray-900 bg-white outline-none focus:ring-1 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword}</p>}
      </div>

      {/* Términos */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={terms}
            onChange={e => setTerms(e.target.checked)}
            className="mt-0.5 accent-blue-600"
          />
          <span className="text-sm text-gray-600 font-light">
            Acepto los{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">términos y condiciones</Link>
            {' '}y la{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">política de privacidad</Link>
          </span>
        </label>
        {errors.terms && <p className="text-[11px] text-red-500 mt-1">{errors.terms}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-medium rounded px-4 py-3 text-sm tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[11px] text-gray-400">O</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google */}
      <button
        type="button"
        className="w-full border border-gray-200 rounded px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <GoogleIcon />
        Continuar con Google
      </button>

      <p className="text-center text-sm text-gray-500 font-light">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4A90D9" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
