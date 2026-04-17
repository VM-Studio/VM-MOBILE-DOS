'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminClients } from '@/lib/hooks/useClients'

interface Client {
  _id: string
  name: string
  email: string
  company?: string
  phone?: string
  isVerified: boolean
  createdAt: string
}

export default function AdminClientesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const { clients, total, isLoading: loading, refresh } = useAdminClients(debouncedSearch, 30)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const token = localStorage.getItem('vm_token')
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setSaving(false); return }
    setShowModal(false)
    setForm({ name: '', email: '', password: '', phone: '', company: '' })
    refresh()
    setSaving(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ CLIENTES ]</span>
          <h1 className="mt-2 text-2xl font-light text-gray-900">Gestión de clientes</h1>
          <p className="mt-1 text-sm text-gray-500 font-light">{total} clientes registrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          + NUEVO CLIENTE
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre, email o empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 border-b border-gray-50 animate-pulse bg-gray-50/50" />
            ))}
          </div>
        ) : !clients.length ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400 font-light">No hay clientes que coincidan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-medium tracking-wider text-gray-400 uppercase px-6 py-3">Cliente</th>
                  <th className="text-left text-[11px] font-medium tracking-wider text-gray-400 uppercase px-6 py-3 hidden sm:table-cell">Empresa</th>
                  <th className="text-left text-[11px] font-medium tracking-wider text-gray-400 uppercase px-6 py-3 hidden md:table-cell">Teléfono</th>
                  <th className="text-left text-[11px] font-medium tracking-wider text-gray-400 uppercase px-6 py-3 hidden lg:table-cell">Verificado</th>
                  <th className="text-left text-[11px] font-medium tracking-wider text-gray-400 uppercase px-6 py-3 hidden lg:table-cell">Alta</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map((c: Client) => (
                  <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400 font-light">{c.email}</p>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-600 font-light">{c.company || '—'}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600 font-light">{c.phone || '—'}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${c.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.isVerified ? 'Verificado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-400 font-light">
                        {new Date(c.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/clientes/${c._id}`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nuevo cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-xl w-full max-w-md p-6 border border-gray-200">
            <h2 className="text-lg font-light text-gray-900 mb-4">Nuevo cliente</h2>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { key: 'name', label: 'Nombre completo', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'password', label: 'Contraseña temporal', type: 'password', required: true },
                { key: 'phone', label: 'Teléfono', type: 'text', required: false },
                { key: 'company', label: 'Empresa', type: 'text', required: false },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-400 text-sm text-gray-700 tracking-wider hover:bg-gray-100 transition-all">
                  CANCELAR
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm tracking-wider hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all">
                  {saving ? 'CREANDO...' : 'CREAR CLIENTE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
