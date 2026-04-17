'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Quote {
  _id: string
  name: string
  email: string
  company?: string
  service: string
  status: string
  budget?: string
  presupuestoCalculado?: { total?: number }
  presupuestoNumber?: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  nueva: 'bg-blue-50 text-blue-700',
  contactado: 'bg-purple-50 text-purple-700',
  propuesta_enviada: 'bg-amber-50 text-amber-700',
  ganada: 'bg-green-50 text-green-700',
  perdida: 'bg-red-50 text-red-700',
}

const statusLabels: Record<string, string> = {
  nueva: 'Nueva',
  contactado: 'Contactado',
  propuesta_enviada: 'Propuesta enviada',
  ganada: 'Ganada',
  perdida: 'Perdida',
}

const serviceLabels: Record<string, string> = {
  web: 'Web',
  app: 'App',
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  combo: 'Combo',
  otro: 'Otro',
}

export default function AdminCotizacionesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', service: 'web', businessType: '', budget: '', message: '', wantsWhatsapp: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const token = () => localStorage.getItem('vm_token') || ''

  const fetchQuotes = (q = '', status = '') => {
    setLoading(true)
    fetch(`/api/admin/quotes?search=${encodeURIComponent(q)}&status=${status}&limit=30`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => { setQuotes(d.quotes || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchQuotes() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => fetchQuotes(search, filterStatus), 350)
    return () => clearTimeout(t)
  }, [search, filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    const res = await fetch('/api/admin/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setSaving(false); return }
    setShowModal(false)
    setForm({ name: '', email: '', company: '', phone: '', service: 'web', businessType: '', budget: '', message: '', wantsWhatsapp: false })
    fetchQuotes(search, filterStatus)
    setSaving(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ COTIZACIONES ]</span>
          <h1 className="mt-2 text-2xl font-light text-gray-900">Gestión de cotizaciones</h1>
          <p className="mt-1 text-sm text-gray-500 font-light">{total} cotizaciones</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
          + NUEVA COTIZACIÓN
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Buscar por nombre, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition-colors">
          <option value="">Todos los estados</option>
          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="space-y-1 p-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 animate-pulse" />)}
          </div>
        </div>
      ) : !quotes.length ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <p className="text-sm text-gray-400 font-light">No hay cotizaciones que coincidan.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Contacto', 'Empresa', 'Servicio', 'Presupuesto', 'Estado', 'Fecha', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotes.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{q.name}</p>
                      <p className="text-xs text-gray-400">{q.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{q.company || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{serviceLabels[q.service] || q.service}</td>
                    <td className="px-5 py-3.5">
                      {q.presupuestoCalculado?.total != null ? (
                        <span className="font-medium text-gray-900">
                          ${q.presupuestoCalculado.total.toLocaleString('es-AR')} ARS
                        </span>
                      ) : q.budget ? (
                        <span className="text-gray-500">{q.budget}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${statusColors[q.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[q.status] || q.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/cotizaciones/${q._id}`} className="text-xs text-blue-600 hover:underline whitespace-nowrap">Ver →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-light text-gray-900 mb-4">Nueva cotización</h2>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                  <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
                  <input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                  <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Servicio *</label>
                  <select required value={form.service} onChange={(e) => setForm((p) => ({ ...p, service: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors">
                    {Object.entries(serviceLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Presupuesto</label>
                  <input value={form.budget} onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" placeholder="Ej: $1000-$3000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rubro / Tipo de negocio</label>
                <input value={form.businessType} onChange={(e) => setForm((p) => ({ ...p, businessType: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje</label>
                <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors resize-none" />
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
