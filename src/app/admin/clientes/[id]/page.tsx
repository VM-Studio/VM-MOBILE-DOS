'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClient } from '@/lib/hooks/useClients'

const projectStatusColors: Record<string, string> = {
  en_progreso: 'bg-blue-100 text-blue-700',
  en_revision: 'bg-amber-100 text-amber-700',
  completado: 'bg-green-100 text-green-700',
  pausado: 'bg-gray-100 text-gray-600',
}
const invoiceStatusColors: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  pagado: 'bg-green-100 text-green-700',
  vencido: 'bg-red-100 text-red-700',
}
const ticketStatusColors: Record<string, string> = {
  abierto: 'bg-blue-100 text-blue-700',
  en_proceso: 'bg-amber-100 text-amber-700',
  resuelto: 'bg-green-100 text-green-700',
}

export default function AdminClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', position: '', website: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'proyectos' | 'facturas' | 'tickets'>('proyectos')

  const { data, isLoading: loading, refresh } = useClient(id ?? null)

  useEffect(() => {
    if (data?.client) {
      setForm({
        name: data.client.name || '',
        email: data.client.email || '',
        phone: data.client.phone || '',
        company: data.client.company || '',
        position: data.client.position || '',
        website: data.client.website || '',
        address: data.client.address || '',
      })
    }
  }, [data])

  const handleSave = async () => {
    setSaving(true)
    const token = localStorage.getItem('vm_token')
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      await refresh()
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return
    const token = localStorage.getItem('vm_token')
    await fetch(`/api/admin/clients/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    router.replace('/admin/clientes')
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Cargando...</div>
  if (!data) return <div className="p-8 text-sm text-red-400">Cliente no encontrado.</div>

  const { client, projects, invoices, tickets } = data

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/clientes" className="text-sm text-gray-400 hover:text-gray-600">← Clientes</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ CLIENTE ]</span>
          <h1 className="mt-2 text-2xl font-light text-gray-900">{client.name}</h1>
          <p className="mt-1 text-sm text-gray-500 font-light">{client.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="px-5 py-2.5 border border-gray-400 text-sm text-gray-700 tracking-wider hover:bg-gray-100 transition-all"
          >
            {editing ? 'CANCELAR' : 'EDITAR'}
          </button>
          <button
            onClick={handleDelete}
            className="px-5 py-2.5 border border-red-300 text-sm text-red-600 tracking-wider hover:bg-red-50 transition-all"
          >
            ELIMINAR
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white border border-gray-200 p-6">
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Nombre' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Teléfono' },
              { key: 'company', label: 'Empresa' },
              { key: 'position', label: 'Cargo' },
              { key: 'website', label: 'Sitio web' },
              { key: 'address', label: 'Dirección' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            ))}
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2.5 text-sm border border-gray-400 text-gray-700 tracking-wider hover:bg-gray-100 transition-all">CANCELAR</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm tracking-wider hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 transition-all">
                {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Empresa', value: client.company },
              { label: 'Teléfono', value: client.phone },
              { label: 'Cargo', value: client.position },
              { label: 'Sitio web', value: client.website },
              { label: 'Dirección', value: client.address },
              { label: 'Verificado', value: client.isVerified ? 'Sí' : 'No' },
              { label: 'Alta', value: new Date(client.createdAt).toLocaleDateString('es-AR') },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 font-light">{item.label}</p>
                <p className="text-sm text-gray-900 font-medium mt-0.5">{item.value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 w-fit">
        {(['proyectos', 'facturas', 'tickets'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-light transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'proyectos' ? `Proyectos (${projects.length})` : t === 'facturas' ? `Facturas (${invoices.length})` : `Soporte (${tickets.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'proyectos' && (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ Proyectos ]</span>
            <Link href={`/admin/proyectos/nuevo?clientId=${id}`} className="text-xs text-blue-600 hover:underline">+ Nuevo proyecto</Link>
          </div>
          {!projects.length ? (
            <p className="p-6 text-sm text-gray-400">Sin proyectos.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {projects.map((p: { _id: string; name: string; status: string; progress: number; awaitingSignature?: boolean; closingSignature?: { signedAt?: string; certificateUrl?: string } | null }) => (
                <div key={p._id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group border-b border-gray-100 last:border-0">
                  <Link href={`/admin/proyectos/${p._id}`} className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">{p.name}</p>
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">{p.progress}%</span>
                    <span className={`text-[10px] px-2 py-0.5 tracking-wider uppercase font-medium ${projectStatusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status.replace('_', ' ')}</span>
                    {p.closingSignature?.signedAt ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Firmado
                        {p.closingSignature?.certificateUrl && (
                          <a
                            href={p.closingSignature.certificateUrl}
                            download={`Cierre-${p.name}.pdf`}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-1 text-blue-600 hover:underline"
                            title="Descargar PDF de cierre"
                          >
                            ↓PDF
                          </a>
                        )}
                      </span>
                    ) : p.awaitingSignature ? (
                      <span className="text-[10px] text-amber-600 font-medium">⏳ Firma pendiente</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'facturas' && (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ Facturas ]</span>
            <Link href={`/admin/facturacion?clientId=${id}`} className="text-xs text-blue-600 hover:underline">+ Nueva factura</Link>
          </div>
          {!invoices.length ? (
            <p className="p-6 text-sm text-gray-400">Sin facturas.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices.map((inv: { _id: string; number: string; amount: number; status: string; createdAt: string }) => (
                <Link key={inv._id} href={`/admin/facturacion`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group">
                  <div>
                    <p className="text-sm text-gray-900 group-hover:text-blue-600 transition-colors">#{inv.number}</p>
                    <p className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">${inv.amount.toLocaleString('es-AR')}</span>
                    <span className={`text-[10px] px-2 py-0.5 tracking-wider uppercase font-medium ${invoiceStatusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'tickets' && (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ Tickets de soporte ]</span>
          </div>
          {!tickets.length ? (
            <p className="p-6 text-sm text-gray-400">Sin tickets.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {tickets.map((t: { _id: string; ticketNumber: string; title: string; status: string; createdAt: string }) => (
                <Link key={t._id} href={`/admin/soporte/${t._id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group">
                  <div>
                    <p className="text-sm text-gray-900 group-hover:text-blue-600 transition-colors">#{t.ticketNumber} — {t.title}</p>
                    <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('es-AR')}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 tracking-wider uppercase font-medium ${ticketStatusColors[t.status] || 'bg-gray-100 text-gray-600'}`}>{t.status.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
