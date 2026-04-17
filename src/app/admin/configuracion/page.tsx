'use client'

import { useEffect, useState } from 'react'
import SignaturePanel from '@/components/admin/perfil/SignaturePanel'

export default function AdminConfiguracionPage() {
  const [adminInfo, setAdminInfo] = useState<{ name: string; email: string; role: string } | null>(null)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [tab, setTab] = useState<'account' | 'studio'>('account')
  const [adminSignature, setAdminSignature] = useState<{ data: string | null; updatedAt: string | null }>({ data: null, updatedAt: null })

  // Studio settings stored in localStorage
  const [studio, setStudio] = useState({ name: 'VM Studio', email: '', address: '', phone: '', website: '' })
  const [studioSaved, setStudioSaved] = useState(false)

  const token = () => localStorage.getItem('vm_token') || ''

  const fetchSignature = async () => {
    const res = await fetch('/api/admin/profile/signature', {
      headers: { Authorization: `Bearer ${token()}` }
    })
    if (res.ok) {
      const d = await res.json()
      setAdminSignature({ data: d.signatureData ?? null, updatedAt: d.signatureUpdatedAt ?? null })
    }
  }

  useEffect(() => {
    const raw = localStorage.getItem('vm_user')
    if (raw) { try { setAdminInfo(JSON.parse(raw)) } catch { /* ignore */ } }
    const savedStudio = localStorage.getItem('vm_studio_config')
    if (savedStudio) { try { setStudio(JSON.parse(savedStudio)) } catch { /* ignore */ } }
    const t = localStorage.getItem('vm_token') || ''
    fetch('/api/admin/profile/signature', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAdminSignature({ data: d.signatureData ?? null, updatedAt: d.signatureUpdatedAt ?? null }) })
      .catch(() => { /* ignore */ })
  }, [])

  const handleSaveStudio = () => {
    localStorage.setItem('vm_studio_config', JSON.stringify(studio))
    setStudioSaved(true)
    setTimeout(() => setStudioSaved(false), 2000)
  }

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ CONFIGURACIÓN ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500 font-light">Ajustes de cuenta y del estudio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 w-fit">
        {(['account', 'studio'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-xs font-medium transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'account' ? 'Mi cuenta' : 'Estudio'}
          </button>
        ))}
      </div>

      {tab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
          {/* Account info */}
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Información de cuenta</p>
            {adminInfo ? (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-blue-700 flex items-center justify-center text-white text-lg font-medium mb-4">
                  {adminInfo.name.charAt(0).toUpperCase()}
                </div>
                {[
                  { label: 'Nombre', value: adminInfo.name },
                  { label: 'Email', value: adminInfo.email },
                  { label: 'Rol', value: adminInfo.role },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm text-gray-800 mt-0.5 capitalize">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Cargando...</p>
            )}
          </div>

          {/* Change password */}
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

            {/* Notificaciones push — solo clientes */}
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

      {tab === 'account' && (
        <div className="max-w-3xl">
          <SignaturePanel
            currentSignature={adminSignature.data}
            updatedAt={adminSignature.updatedAt}
            onSaved={fetchSignature}
          />
        </div>
      )}

      {tab === 'studio' && (
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
