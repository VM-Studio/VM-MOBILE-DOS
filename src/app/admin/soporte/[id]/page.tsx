'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Message { content: string; senderRole: string; senderId: string; createdAt: string }
interface Ticket {
  _id: string
  title: string
  description?: string
  status: string
  priority: string
  category: string
  ticketNumber: string
  clientId: { _id: string; name: string; company?: string; email: string }
  messages?: Message[]
  createdAt: string
}

const statusColors: Record<string, string> = {
  abierto: 'bg-blue-50 text-blue-700', en_proceso: 'bg-amber-50 text-amber-700',
  resuelto: 'bg-green-50 text-green-700',
}
const priorityColors: Record<string, string> = {
  baja: 'text-gray-400', media: 'text-amber-500', alta: 'text-red-600',
}

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const repliesEndRef = useRef<HTMLDivElement>(null)

  const token = () => localStorage.getItem('vm_token') || ''

  const fetchTicket = async () => {
    const res = await fetch(`/api/admin/tickets/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
    const d = await res.json()
    setTicket(d.ticket || null)
    setLoading(false)
  }

  useEffect(() => { fetchTicket() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticket?.messages])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSaving(true); setError('')
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ content: replyText }),
    })
    const d = await res.json()
    if (!res.ok) { setError(d.error || 'Error'); setSaving(false); return }
    setTicket(d.ticket); setReplyText(''); setSaving(false)
  }

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === ticket?.status) return
    setSaving(true)
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ status: newStatus }),
    })
    const d = await res.json()
    if (res.ok) { setTicket(d.ticket); setNewStatus('') }
    setSaving(false)
  }

  if (loading) return (
    <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse" />)}</div>
  )
  if (!ticket) return <div className="p-8 text-center text-sm text-gray-400">Ticket no encontrado.</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/soporte" className="text-xs text-gray-400 hover:text-blue-600">← Soporte</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ TICKET ]</span>
          </div>
          <h1 className="text-2xl font-light text-gray-900">{ticket.ticketNumber} — {ticket.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 tracking-wider uppercase ${statusColors[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
            <span className={`text-xs font-medium capitalize ${priorityColors[ticket.priority]}`}>● {ticket.priority}</span>
            <span className="text-xs text-gray-400 capitalize">{ticket.category}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread */}
        <div className="lg:col-span-2 space-y-4">
          {/* Original description */}
          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-600">{ticket.clientId?.name} <span className="text-gray-300">— cliente</span></p>
              <p className="text-[10px] text-gray-400">{new Date(ticket.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <p className="text-sm text-gray-700 font-light leading-relaxed">{ticket.title}</p>
          </div>

          {/* Messages thread */}
          {(ticket.messages || []).map((m: Message, i: number) => {
            const isAdmin = m.senderRole === 'admin' || m.senderRole === 'superadmin'
            return (
              <div key={i} className={`p-5 border ${isAdmin ? 'bg-blue-50 border-blue-100 ml-6' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xs font-medium ${isAdmin ? 'text-blue-700' : 'text-gray-600'}`}>
                    {isAdmin ? '👤 Soporte VM Studio' : ticket.clientId?.name}
                  </p>
                  <p className="text-[10px] text-gray-400">{new Date(m.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className="text-sm text-gray-700 font-light leading-relaxed">{m.content}</p>
              </div>
            )
          })}
          <div ref={repliesEndRef} />

          {/* Reply form — show while not resolved */}
          {ticket.status !== 'resuelto' && (
            <form onSubmit={handleReply} className="bg-white border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-600 mb-3">Responder al cliente</p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Escribí tu respuesta..."
                className="w-full px-3 py-2.5 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors resize-none"
              />
              <div className="mt-3 flex justify-end">
                <button type="submit" disabled={saving || !replyText.trim()} className="px-5 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-40">
                  {saving ? 'ENVIANDO...' : 'ENVIAR RESPUESTA'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Cambiar estado</p>
            <select value={newStatus || ticket.status} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors mb-2">
              <option value="abierto">Abierto</option>
              <option value="en_proceso">En proceso</option>
              <option value="resuelto">Resuelto</option>
            </select>
            <button onClick={handleStatusChange} disabled={saving || !newStatus || newStatus === ticket.status} className="w-full px-3 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-xs font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-40">
              ACTUALIZAR
            </button>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Cliente</p>
            <p className="text-sm font-medium text-gray-900">{ticket.clientId?.name}</p>
            {ticket.clientId?.company && <p className="text-xs text-gray-400 mt-0.5">{ticket.clientId.company}</p>}
            <p className="text-xs text-gray-400 mt-0.5">{ticket.clientId?.email}</p>
            <Link href={`/admin/clientes/${ticket.clientId?._id}`} className="mt-3 block text-xs text-blue-600 hover:underline">Ver perfil →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
