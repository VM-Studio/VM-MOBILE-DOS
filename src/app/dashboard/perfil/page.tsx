'use client'

import { useEffect, useState } from 'react'
import useAuth from '@/hooks/useAuth'

interface UserData {
  name: string; email: string; phone: string; company: string; position: string
  website?: string; address?: string
}

type Tab = 'personal' | 'empresa' | 'seguridad'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export default function PerfilPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [formData, setFormData] = useState<UserData>({ name: '', email: '', phone: '', company: '', position: '', website: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [probando, setProbando] = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState('')

  const token = () => localStorage.getItem('vm_token') ?? ''

  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setFormData({
            name: d.user.name ?? '',
            email: d.user.email ?? '',
            phone: d.user.phone ?? '',
            company: d.user.company ?? '',
            position: d.user.position ?? '',
            website: d.user.website ?? '',
            address: d.user.address ?? '',
          })
        }
        setLoading(false)
      })
  }, [])

  const set = (field: keyof UserData, value: string) => setFormData((p) => ({ ...p, [field]: value }))

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(formData),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const changePassword = async () => {
    setPwError('')
    if (passwords.newPass !== passwords.confirm) { setPwError('Las contraseñas no coinciden.'); return }
    if (passwords.newPass.length < 8) { setPwError('Mínimo 8 caracteres.'); return }
    setChangingPw(true)
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
    })
    setChangingPw(false)
    if (res.ok) { setPwSuccess(true); setPasswords({ current: '', newPass: '', confirm: '' }) }
    else { const d = await res.json(); setPwError(d.error ?? 'Error al cambiar la contraseña.') }
  }

  const initials = formData.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const TABS: { key: Tab; label: string }[] = [
    { key: 'personal', label: 'Datos personales' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'seguridad', label: 'Seguridad' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ MI PERFIL ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Mi Perfil</h1>
      </div>

      {/* Avatar & name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-blue-700 flex items-center justify-center text-white text-lg font-light">
          {initials || '?'}
        </div>
        <div>
          {loading ? <Skeleton className="h-5 w-40 mb-1" /> : <p className="text-base font-medium text-gray-900">{formData.name}</p>}
          {loading ? <Skeleton className="h-3 w-32" /> : <p className="text-xs text-gray-400">{formData.email}</p>}
          {user?.role === 'admin' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 uppercase tracking-wider font-medium">Admin</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`text-[10px] font-medium tracking-wider uppercase px-5 py-3 transition-all border-b-2 -mb-[2px] ${activeTab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Personal */}
      {activeTab === 'personal' && (
        <div className="bg-white border border-gray-200 p-6 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Nombre completo</label>
                  <input className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    value={formData.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Email</label>
                  <input className="w-full border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                    value={formData.email} disabled />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                  <input className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    value={formData.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+54 11 ..." />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Cargo</label>
                  <input className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    value={formData.position} onChange={(e) => set('position', e.target.value)} placeholder="CEO, Fundador..." />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                {saved && <span className="text-[11px] text-green-600">✓ Cambios guardados</span>}
                {!saved && <span />}
                <button onClick={save} disabled={saving}
                  className="bg-gradient-to-r from-gray-900 to-blue-700 text-white text-[10px] font-medium tracking-widest uppercase px-6 py-2.5 disabled:opacity-50 transition-opacity">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Empresa */}
      {activeTab === 'empresa' && (
        <div className="bg-white border border-gray-200 p-6 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Nombre de empresa</label>
                <input className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={formData.company} onChange={(e) => set('company', e.target.value)} placeholder="Mi Empresa S.A." />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Sitio web</label>
                <input className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={formData.website ?? ''} onChange={(e) => set('website', e.target.value)} placeholder="https://miempresa.com" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Dirección</label>
                <input className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={formData.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Av. Corrientes 123, Buenos Aires" />
              </div>
              <div className="flex items-center justify-between pt-2">
                {saved && <span className="text-[11px] text-green-600">✓ Cambios guardados</span>}
                {!saved && <span />}
                <button onClick={save} disabled={saving}
                  className="bg-gradient-to-r from-gray-900 to-blue-700 text-white text-[10px] font-medium tracking-widest uppercase px-6 py-2.5 disabled:opacity-50 transition-opacity">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Seguridad */}
      {activeTab === 'seguridad' && (
        <div className="bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Contraseña actual</label>
            <input type="password" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Nueva contraseña</label>
            <input type="password" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Confirmar nueva contraseña</label>
            <input type="password" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
          </div>
          {pwError && <p className="text-[11px] text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-[11px] text-green-600">✓ Contraseña actualizada correctamente.</p>}
          <div className="flex justify-end pt-2">
            <button onClick={changePassword} disabled={changingPw || !passwords.current || !passwords.newPass}
              className="bg-gradient-to-r from-gray-900 to-blue-700 text-white text-[10px] font-medium tracking-widest uppercase px-6 py-2.5 disabled:opacity-50 transition-opacity">
              {changingPw ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <button onClick={logout}
              className="text-[10px] font-medium tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors">
              Cerrar sesión
            </button>
          </div>

          {/* Test notificaciones push */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">[ NOTIFICACIONES PUSH ]</p>
            <button
              onClick={async () => {
                setProbando(true)
                setResultadoPrueba('')
                try {
                  const t = localStorage.getItem('vm_token')
                  const res = await fetch('/api/push/test', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${t}` }
                  })
                  const data = await res.json()
                  setResultadoPrueba(
                    data.success
                      ? '✅ Enviada. Cerrá la app y esperá 5 segundos.'
                      : `❌ ${data.error}`
                  )
                } catch (e: unknown) {
                  setResultadoPrueba(`❌ ${e instanceof Error ? e.message : 'Error'}`)
                }
                setProbando(false)
              }}
              disabled={probando}
              className="w-full py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-xs font-medium tracking-widest uppercase hover:opacity-90 disabled:opacity-50 mt-2"
            >
              {probando ? 'ENVIANDO...' : 'PROBAR NOTIFICACIÓN'}
            </button>
            {resultadoPrueba && (
              <p className="text-xs text-center text-gray-500 mt-2">{resultadoPrueba}</p>
            )}
            <button
              onClick={() => {
                ['vm_push_v3','vm_push_v4','vm_push_v5',
                 'vm_push_dismissed','vm_push_dismissed_v2']
                  .forEach(k => localStorage.removeItem(k))
                window.location.reload()
              }}
              className="w-full py-2 border border-gray-200 text-xs text-gray-400 hover:bg-gray-50 mt-2"
            >
              RESETEAR Y REACTIVAR NOTIFICACIONES
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
