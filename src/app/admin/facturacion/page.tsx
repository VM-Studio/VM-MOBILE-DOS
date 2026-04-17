'use client'

import { useEffect, useState } from 'react'
import AdminPaymentActions from '@/components/payments/AdminPaymentActions'
import DownloadPDFButton from '@/components/pdf/DownloadPDFButton'
import SendPDFButton from '@/components/pdf/SendPDFButton'
import { useAdminInvoices } from '@/lib/hooks/useInvoices'

interface Invoice {
  _id: string
  number: string
  clientId: { _id: string; name: string; company?: string; email: string }
  description?: string
  amount: number
  status: string
  dueDate?: string
  paidDate?: string
  createdAt: string
  paymentMethodNew?: 'mercadopago' | 'transferencia' | null
  transferComprobante?: string | null
  transferComprobanteNombre?: string | null
  transferEnviadoAt?: string | null
}

const statusColors: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-700',
  verificando: 'bg-blue-50 text-blue-700',
  pagado: 'bg-green-50 text-green-700',
  vencido: 'bg-red-50 text-red-700',
  rechazado: 'bg-red-50 text-red-700',
}

export default function AdminFacturacionPage() {
  const [filterStatus, setFilterStatus] = useState('')
  const [clients, setClients] = useState<{ _id: string; name: string; company?: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ clientId: '', number: '', description: '', amount: '', dueDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const token = () => localStorage.getItem('vm_token') || ''

  const filters = new URLSearchParams()
  if (filterStatus) filters.set('status', filterStatus)
  filters.set('limit', '50')

  const { invoices, total, isLoading: loading, refresh } = useAdminInvoices(filters.toString())

  // Fetch clients once for create modal dropdown
  useEffect(() => {
    fetch('/api/admin/clients?limit=100', { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json()).then((d) => setClients(d.clients || []))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    const res = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setSaving(false); return }
    setShowModal(false)
    setForm({ clientId: '', number: '', description: '', amount: '', dueDate: '' })
    refresh()
    setSaving(false)
  }

  const handleMarkPaid = async (invId: string) => {
    if (!confirm('¿Marcar como pagada?')) return
    const res = await fetch(`/api/admin/invoices/${invId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ status: 'pagado' }),
    })
    if (res.ok) refresh()
  }

  const handleDelete = async (invId: string) => {
    if (!confirm('¿Eliminar factura?')) return
    await fetch(`/api/admin/invoices/${invId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
    refresh()
  }

  const totalRevenue = invoices.filter((i: Invoice) => i.status === 'pagado').reduce((s: number, i: Invoice) => s + i.amount, 0)
  const totalPending = invoices.filter((i: Invoice) => i.status === 'pendiente').reduce((s: number, i: Invoice) => s + i.amount, 0)
  const pendingTransfers = invoices.filter((i: Invoice) => i.status === 'verificando')

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateInvoiceInList = (_updated: unknown) => { refresh() }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ FACTURACIÓN ]</span>
          <h1 className="mt-2 text-2xl font-light text-gray-900">Gestión de facturas</h1>
          <p className="mt-1 text-sm text-gray-500 font-light">{total} facturas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
          + NUEVA FACTURA
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Cobrado</p>
          <p className="text-xl font-light text-green-600 mt-1">${totalRevenue.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Pendiente</p>
          <p className="text-xl font-light text-amber-600 mt-1">${totalPending.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Total facturas</p>
          <p className="text-xl font-light text-gray-900 mt-1">{total}</p>
        </div>
      </div>

      {/* Filter */}
      <div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition-colors">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="verificando">En verificación</option>
          <option value="pagado">Pagado</option>
          <option value="vencido">Vencido</option>
        </select>
      </div>

      {/* Sección transferencias pendientes de verificación */}
      {!loading && pendingTransfers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-blue-800">
              {pendingTransfers.length} transferencia{pendingTransfers.length > 1 ? 's' : ''} pendiente{pendingTransfers.length > 1 ? 's' : ''} de verificación
            </h3>
          </div>
          <div className="space-y-3">
            {pendingTransfers.map((inv: Invoice) => (
              <div key={inv._id} className="bg-white border border-blue-100 rounded-lg px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{inv.number} — {inv.clientId?.name}
                      {inv.clientId?.company && <span className="text-gray-400 font-normal"> ({inv.clientId.company})</span>}
                    </p>
                    <p className="text-xs text-gray-500">{inv.description || '—'}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">${inv.amount.toLocaleString('es-AR')}</p>
                  </div>
                  <AdminPaymentActions invoice={inv} onUpdate={(updated) => updateInvoiceInList(updated as Invoice)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 animate-pulse" />)}
        </div>
      ) : !invoices.length ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <p className="text-sm text-gray-400 font-light">Sin facturas.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Nro.', 'Cliente', 'Descripción', 'Monto', 'Estado', 'Vencimiento', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv: Invoice) => (
                  <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{inv.number}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{inv.clientId?.name}</p>
                      <p className="text-xs text-gray-400">{inv.clientId?.company || inv.clientId?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate">{inv.description || '—'}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">${inv.amount.toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-AR') : '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          {inv.status === 'pendiente' && (
                            <button onClick={() => handleMarkPaid(inv._id)} className="text-[10px] text-green-600 hover:underline whitespace-nowrap">Marcar pagada</button>
                          )}
                          <button onClick={() => handleDelete(inv._id)} className="text-[10px] text-red-400 hover:text-red-600">✕</button>
                        </div>
                        <AdminPaymentActions invoice={inv} onUpdate={(updated) => updateInvoiceInList(updated as Invoice)} />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <DownloadPDFButton
                            type="invoice"
                            id={inv._id}
                            filename={`VM-Factura-${inv.number}`}
                            variant="outline"
                            label="PDF"
                          />
                          <SendPDFButton
                            type="invoice"
                            id={inv._id}
                            clientEmail={inv.clientId?.email}
                          />
                        </div>
                      </div>
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
          <div className="bg-white shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-light text-gray-900 mb-4">Nueva factura</h2>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cliente *</label>
                <select required value={form.clientId} onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors">
                  <option value="">Seleccioná un cliente</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.company ? `${c.company} — ` : ''}{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Número *</label>
                  <input required value={form.number} onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))} placeholder="0001" className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Monto *</label>
                  <input required type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-400 text-sm text-gray-700 tracking-wider hover:bg-gray-100 transition-all">CANCELAR</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-50">
                  {saving ? 'CREANDO...' : 'CREAR FACTURA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
