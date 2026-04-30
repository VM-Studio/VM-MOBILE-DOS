'use client'

import { useEffect, useState } from 'react'
import SignaturePanel from '@/components/admin/perfil/SignaturePanel'

interface AdminProfile {
  name: string
  email: string
  role: string
  signatureData?: string | null
  signatureUpdatedAt?: string | null
}

type Tab = 'perfil' | 'seguridad' | 'estudio'

export default function AdminPerfilPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('perfil')

  // Cambiar contraseña
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // Estudio
  const [studio, setStudio] = useState({ name: 'VM Studio', email: '', address: '', phone: '', website: '' })
  const [studioSaved, setStudioSaved] = useState(false)

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('vm_token') ?? '' : '')

  const fetchProfile = async () => {
    const res = await fetch('/api/admin/profile', {
      headers: { Authorization: `Bearer ${token()}` },
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(data.user)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()
    const savedStudio = localStorage.getItem('vm_studio_config')
    if (savedStudio) { try { setStudio(JSON.parse(savedStudio)) } catch { /* ignore */ } }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Las contraseñas no coinciden'); return }
    if (pwForm.newPassword.length < 6) { setPwError('La contraseña debe tener al menos 6 caracteres'); return }
    setPwSaving(true); setPwError('')
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const d = await res.json()
    if (!res.ok) { setPwError(d.error || 'Error al cambiar contraseña'); setPwSaving(false); return }
    setPwSuccess(true); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setPwSuccess(false), 3000)
    setPwSaving(false)
  }

  const handleSaveStudio = () => {
    localStorage.setItem('vm_studio_config', JSON.stringify(studio))
    setStudioSaved(true)
    setTimeout(() => setStudioSaved(false), 2000)
  }

  const roleLabel: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    empleado: 'Empleado',
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'perfil', label: 'Mi perfil' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'estudio', label: 'Estudio' },
  ]

  if (loading) return <div className="p-8 text-sm text-gray-400">Cargando...</div>
  if (!profile) return <div className="p-8 text-sm text-red-400">No se pudo cargar el perfil.</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ MI PERFIL ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Mi perfil</h1>
        <p className="mt-1 text-sm text-gray-500 font-light">Configuración de cuenta y del estudio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-xs font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Mi perfil ── */}
      {tab === 'perfil' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Información de cuenta</p>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-blue-700 flex items-center justify-center text-white text-xl font-medium flex-shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { label: 'Nombre', value: profile.name },
                  { label: 'Email', value: profile.email },
                  { label: 'Rol', value: roleLabel[profile.role] ?? profile.role },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SignaturePanel
            currentSignature={profile.signatureData}
            updatedAt={profile.signatureUpdatedAt}
            onSaved={fetchProfile}
          />
        </div>
      )}

      {/* ── Tab: Seguridad ── */}
      {tab === 'seguridad' && (
        <div className="max-w-sm">
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Cambiar contraseña</p>
            {pwSuccess && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 text-xs text-green-700">✓ Contraseña actualizada.</div>
            )}
            {pwError && <p className="text-xs text-red-500 mb-3">{pwError}</p>}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña actual</label>
                <input required type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
                <input required type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña</label>
                <input required type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <button type="submit" disabled={pwSaving} className="w-full px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-50 mt-2">
                {pwSaving ? 'GUARDANDO...' : 'CAMBIAR CONTRASEÑA'}
              </button>
            </form>

            <div className="border-t border-gray-100 mt-6 pt-4">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">[ NOTIFICACIONES PUSH ]</p>
              <p className="text-xs text-gray-400">
                Las notificaciones push están habilitadas únicamente para clientes.<br />
                Los clientes las activan desde su panel de usuario.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Estudio ── */}
      {tab === 'estudio' && (
        <div className="max-w-xl">
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Datos del estudio</p>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Nombre del estudio', placeholder: 'VM Studio' },
                { key: 'email', label: 'Email de contacto', placeholder: 'hola@vmstudio.com.ar' },
                { key: 'phone', label: 'Teléfono', placeholder: '+54 9 11 0000 0000' },
                { key: 'address', label: 'Dirección', placeholder: 'Buenos Aires, Argentina' },
                { key: 'website', label: 'Sitio web', placeholder: 'https://vmstudio.com.ar' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    value={studio[key as keyof typeof studio]}
                    onChange={(e) => setStudio((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              ))}
              <button onClick={handleSaveStudio} className="mt-3 px-5 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all">
                {studioSaved ? '✓ GUARDADO' : 'GUARDAR CONFIGURACIÓN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
