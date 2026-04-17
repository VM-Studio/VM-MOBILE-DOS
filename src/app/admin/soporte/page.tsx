'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAdminTickets } from '@/lib/hooks/useTickets'

interface Ticket {
  _id: string
  title: string
  status: string
  priority: string
  category: string
  ticketNumber: string
  clientId: { _id: string; name: string; company?: string }
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, string> = {
  abierto: 'bg-blue-50 text-blue-700',
  en_proceso: 'bg-amber-50 text-amber-700',
  resuelto: 'bg-green-50 text-green-700',
}
const priorityColors: Record<string, string> = {
  baja: 'text-gray-400', media: 'text-amber-500', alta: 'text-red-600',
}

export default function AdminSoportePage() {
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const filters = new URLSearchParams()
  if (filterStatus) filters.set('status', filterStatus)
  if (filterPriority) filters.set('priority', filterPriority)
  filters.set('limit', '50')

  const { tickets, total, isLoading: loading } = useAdminTickets(filters.toString())

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ SOPORTE ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Tickets de soporte</h1>
        <p className="mt-1 text-sm text-gray-500 font-light">{total} tickets</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition-colors">
          <option value="">Todos los estados</option>
          <option value="abierto">Abierto</option>
          <option value="en_proceso">En proceso</option>
          <option value="resuelto">Resuelto</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition-colors">
          <option value="">Todas las prioridades</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 animate-pulse" />)}
        </div>
      ) : !tickets.length ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <p className="text-sm text-gray-400 font-light">No hay tickets que coincidan.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Asunto', 'Cliente', 'Categoría', 'Prioridad', 'Estado', 'Actualizado', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((t: Ticket) => (
                  <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <p className="font-medium text-gray-900 truncate">{t.title}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-700">{t.clientId?.name}</p>
                      <p className="text-xs text-gray-400">{t.clientId?.company}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 capitalize">{t.category}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium capitalize ${priorityColors[t.priority] || 'text-gray-500'}`}>{t.priority}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}`}>{t.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(t.updatedAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/soporte/${t._id}`} className="text-xs text-blue-600 hover:underline whitespace-nowrap">Responder →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
