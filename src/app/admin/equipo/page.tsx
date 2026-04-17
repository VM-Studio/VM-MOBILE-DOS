'use client'

import { useEffect, useState } from 'react'

interface Member {
  _id: string
  name: string
  email: string
  role: string
  company?: string
  phone?: string
  createdAt: string
  isVerified: boolean
}

const roleColors: Record<string, string> = {
  admin: 'bg-blue-50 text-blue-700',
  superadmin: 'bg-purple-50 text-purple-700',
  cliente: 'bg-gray-100 text-gray-600',
}

export default function AdminEquipoPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [currentRole, setCurrentRole] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const token = () => localStorage.getItem('vm_token') || ''

  const fetchTeam = () => {
    setLoading(true)
    fetch('/api/admin/team', { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => { setMembers(d.members || []); setLoading(false) })
      .catch(() => setLoading(false))
    const raw = localStorage.getItem('vm_user')
    if (raw) { try { setCurrentRole(JSON.parse(raw)?.role || '') } catch { /* ignore */ } }
  }

  useEffect(() => { fetchTeam() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setSaving(false); return }
    setShowModal(false); setForm({ name: '', email: '', password: '', role: 'admin' }); fetchTeam(); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este miembro del equipo?')) return
    await fetch(`/api/admin/team/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
    fetchTeam()
  }

  const handleRoleChange = async (id: string, role: string) => {
    await fetch(`/api/admin/team/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ role }),
    })
    fetchTeam()
  }

  const isSuperAdmin = currentRole === 'superadmin'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ EQUIPO ]</span>
          <h1 className="mt-2 text-2xl font-light text-gray-900">Gestión del equipo</h1>
          <p className="mt-1 text-sm text-gray-500 font-light">{members.length} miembros</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
            + NUEVO MIEMBRO
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
          Solo el superadmin puede crear o eliminar miembros del equipo.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 bg-gray-100 animate-pulse" />)}
        </div>
      ) : !members.length ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <p className="text-sm text-gray-400 font-light">No hay miembros del equipo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div key={m._id} className="bg-white border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-blue-700 flex items-center justify-center text-white text-sm font-medium">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${roleColors[m.role] || 'bg-gray-100 text-gray-600'}`}>{m.role}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{m.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.email}</p>
              <p className="text-[10px] text-gray-300 mt-2">Alta: {new Date(m.createdAt).toLocaleDateString('es-AR')}</p>

              {isSuperAdmin && (
                <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-100">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m._id, e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-blue-400 transition-colors"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                  <button onClick={() => handleDelete(m._id)} className="px-2 py-1.5 border border-red-200 text-xs text-red-500 hover:bg-red-50">
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-light text-gray-900 mb-4">Nuevo miembro</h2>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña *</label>
                <input required type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors">
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-400 text-sm text-gray-700 tracking-wider hover:bg-gray-100 transition-all">CANCELAR</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-50">
                  {saving ? 'CREANDO...' : 'CREAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
