'use client'

import { useState } from 'react'
import { useMyTickets } from '@/lib/hooks/useTickets'

interface TicketMsg { _id: string; content: string; senderRole: string; createdAt: string }
interface Ticket {
  _id: string; ticketNumber: string; title: string; category: string; priority: string
  status: string; messages: TicketMsg[]; rating?: number; createdAt: string
}

type Filter = 'todos' | 'abierto' | 'en_proceso' | 'resuelto'

const STATUS_COLORS: Record<string, string> = {
  abierto: 'bg-blue-100 text-blue-700',
  en_proceso: 'bg-yellow-100 text-yellow-700',
  resuelto: 'bg-green-100 text-green-700',
}
const PRIORITY_COLORS: Record<string, string> = {
  alta: 'text-red-600', media: 'text-yellow-600', baja: 'text-gray-500',
}
const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug', consulta: 'Consulta', cambio: 'Cambio', urgente: 'Urgente',
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export default function SoportePage() {
  const { tickets, isLoading: loading, refresh } = useMyTickets()
  const [filter, setFilter] = useState<Filter>('todos')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newTicket, setNewTicket] = useState({ title: '', category: 'consulta', priority: 'media', description: '' })
  const [creating, setCreating] = useState(false)
  const [rating, setRating] = useState(0)
  const [rated, setRated] = useState(false)

  const token = () => localStorage.getItem('vm_token') ?? ''

  const openTicket = (t: Ticket) => { setSelected(t); setReply(''); setRating(t.rating ?? 0); setRated(!!t.rating) }

  const sendReply = async () => {
    if (!reply.trim() || !selected) return
    setSendingReply(true)
    await fetch(`/api/tickets/${selected._id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ content: reply.trim(), senderRole: 'cliente' }),
    })
    setSendingReply(false)
    setReply('')
    await refresh()
    // refresh selected from updated list
    const fresh = await fetch(`/api/tickets`, { headers: { Authorization: `Bearer ${token()}` } })
    const d = await fresh.json()
    const found = (d.tickets ?? []).find((t: Ticket) => t._id === selected._id)
    if (found) setSelected(found)
  }

  const resolve = async () => {
    if (!selected) return
    await fetch(`/api/tickets/${selected._id}/resolve`, { method: 'PUT', headers: { Authorization: `Bearer ${token()}` } })
    await refresh()
    setSelected((prev) => prev ? { ...prev, status: 'resuelto' } : null)
  }

  const submitRating = async (r: number) => {
    if (!selected || rated) return
    setRating(r)
    await fetch(`/api/tickets/${selected._id}/rating`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ rating: r }),
    })
    setRated(true)
    await refresh()
  }

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) return
    setCreating(true)
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...newTicket, messages: [{ content: newTicket.description, senderRole: 'cliente' }] }),
    })
    setCreating(false)
    setShowNew(false)
    setNewTicket({ title: '', category: 'consulta', priority: 'media', description: '' })
    refresh()
  }

  const filtered = filter === 'todos' ? tickets : tickets.filter((t: Ticket) => t.status === filter)

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'todos', label: 'Todos' }, { key: 'abierto', label: 'Abiertos' },
    { key: 'en_proceso', label: 'En proceso' }, { key: 'resuelto', label: 'Resueltos' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ SOPORTE ]</span>
          <h1 className="mt-2 text-2xl font-light text-gray-900">Soporte</h1>
        </div>
        <button onClick={() => setShowNew(true)}
          className="bg-gradient-to-r from-gray-900 to-blue-700 text-white text-[10px] font-medium tracking-widest uppercase px-5 py-2.5">
          + Nuevo ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-gray-100 p-1 w-fit">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-[10px] font-medium tracking-wider uppercase px-3 py-1.5 transition-all ${filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400">No hay tickets en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t: Ticket) => (
            <div key={t._id} onClick={() => openTicket(t)}
              className="bg-white border border-gray-200 p-5 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-mono">{t.ticketNumber}</span>
                    <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${STATUS_COLORS[t.status]}`}>{t.status.replace('_', ' ')}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 uppercase tracking-wider">{CATEGORY_LABELS[t.category]}</span>
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${PRIORITY_COLORS[t.priority]}`}>● {t.priority}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{t.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString('es-AR')} · {(t.messages ?? []).length} mensaje{(t.messages ?? []).length !== 1 ? 's' : ''}
                  </p>
                </div>
                {t.rating && (
                  <span className="text-xs text-yellow-500">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket detail drawer/modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-mono">{selected.ticketNumber}</span>
                  <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${STATUS_COLORS[selected.status]}`}>
                    {selected.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-sm font-medium text-gray-900 mt-1">{selected.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                {selected.status !== 'resuelto' && (
                  <button onClick={resolve}
                    className="text-[10px] font-medium tracking-widest uppercase border border-green-500 text-green-600 px-3 py-1.5 hover:bg-green-50 transition-colors">
                    Marcar resuelto
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {selected.messages.map((m) => {
                const isOwn = m.senderRole === 'cliente'
                return (
                  <div key={m._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 text-xs ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      {!isOwn && <p className="text-[10px] font-medium mb-1 text-gray-500">Equipo VM Studio</p>}
                      <p>{m.content}</p>
                      <p className={`text-[9px] mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Rating */}
            {selected.status === 'resuelto' && (
              <div className="px-4 py-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Calificá la atención</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => submitRating(s)} disabled={rated}
                      className={`text-2xl transition-colors ${s <= rating ? 'text-yellow-400' : 'text-gray-300'} ${!rated ? 'hover:text-yellow-400' : 'cursor-default'}`}>
                      ★
                    </button>
                  ))}
                  {rated && <span className="text-[10px] text-gray-400 ml-2 self-center">¡Gracias por tu calificación!</span>}
                </div>
              </div>
            )}

            {/* Reply */}
            {selected.status !== 'resuelto' && (
              <div className="border-t border-gray-200 p-3 flex gap-2">
                <input className="flex-1 text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:border-blue-400 placeholder-gray-400"
                  placeholder="Escribí tu respuesta..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                />
                <button onClick={sendReply} disabled={sendingReply || !reply.trim()}
                  className="bg-gradient-to-r from-gray-900 to-blue-700 text-white text-[10px] font-medium tracking-widest uppercase px-4 py-2 disabled:opacity-50">
                  {sendingReply ? '...' : 'Enviar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New ticket modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-gray-900">Nuevo Ticket de Soporte</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Título</label>
                <input className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} placeholder="Resumen del problema" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Categoría</label>
                  <select className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}>
                    <option value="consulta">Consulta</option>
                    <option value="bug">Bug</option>
                    <option value="cambio">Cambio</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Prioridad</label>
                  <select className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
                <textarea rows={4} className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Describí el problema en detalle..." />
              </div>
              <button onClick={createTicket} disabled={creating || !newTicket.title || !newTicket.description}
                className="w-full bg-gradient-to-r from-gray-900 to-blue-700 text-white text-[10px] font-medium tracking-widest uppercase py-3 disabled:opacity-50 transition-opacity">
                {creating ? 'Creando...' : 'Crear ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
