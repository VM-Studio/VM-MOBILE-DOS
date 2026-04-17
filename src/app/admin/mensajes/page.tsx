'use client'

import { useEffect, useRef, useState } from 'react'

interface Room {
  roomId: string
  roomType: string
  nombre: string
  lastMessage: string | null
  unreadCount: number
}

interface ClientWithRooms {
  _id: string
  name: string
  email: string
  company?: string
  rooms: Room[]
  totalUnread: number
}

interface Message {
  _id: string
  senderId: { _id: string; name: string; role: string } | string
  content: string
  createdAt: string
  senderRole: string
}

interface ActiveChat {
  client: ClientWithRooms
  room: Room
}

export default function AdminMensajesPage() {
  const [clients, setClients] = useState<ClientWithRooms[]>([])
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const token = () => localStorage.getItem('vm_token') || ''
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }

  useEffect(() => {
    fetch('/api/admin/messages', { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => { setClients(d.clients || []); setLoading(false) })
  }, [])

  const loadMessages = async (client: ClientWithRooms, room: Room) => {
    setActiveChat({ client, room })
    const res = await fetch(
      `/api/admin/messages/${client._id}?roomType=${room.roomType}`,
      { headers: { Authorization: `Bearer ${token()}` } }
    )
    const d = await res.json()
    setMessages(d.messages || [])
    // Clear unread badge locally for this room
    setClients((prev) =>
      prev.map((c) =>
        c._id === client._id
          ? {
              ...c,
              rooms: c.rooms.map((r) =>
                r.roomType === room.roomType ? { ...r, unreadCount: 0 } : r
              ),
              totalUnread: Math.max(0, c.totalUnread - room.unreadCount),
            }
          : c
      )
    )
    setTimeout(scrollToBottom, 100)
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !activeChat) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/messages/${activeChat.client._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ content: newMsg, roomType: activeChat.room.roomType }),
      })
      const text = await res.text()
      const d = text ? JSON.parse(text) : {}
      if (res.ok && d.message) {
        setMessages((p) => [...p, d.message])
        setNewMsg('')
      } else {
        console.error('Error enviando mensaje:', d.error || res.status)
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err)
    } finally {
      setSending(false)
    }
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-5">
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ MENSAJES ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Centro de mensajes</h1>
      </div>

      <div className="flex gap-0 sm:gap-4 flex-1 min-h-0">
        {/* Sidebar — clientes con sus 2 salas */}
        <div className={`${activeChat ? 'hidden sm:flex' : 'flex'} w-full sm:w-72 bg-white border border-gray-200 flex-col overflow-hidden flex-shrink-0`}>
          <div className="p-3 border-b border-gray-100">
            <input
              type="text" placeholder="Buscar cliente..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Sin clientes.</p>
            ) : (
              filtered.map((c) => (
                <div key={c._id} className="border-b border-gray-50">
                  {/* Cliente header — clickeable para expandir/contraer */}
                  <button
                    onClick={() => setExpandedClient(expandedClient === c._id ? null : c._id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{c.company || c.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {c.totalUnread > 0 && (
                          <span className="w-5 h-5 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {c.totalUnread}
                          </span>
                        )}
                        <span className="text-gray-400 text-[10px]">{expandedClient === c._id ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </button>
                  {/* Salas del cliente */}
                  {expandedClient === c._id && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {c.rooms.map((room) => (
                        <button
                          key={room.roomId}
                          onClick={() => loadMessages(c, room)}
                          className={`w-full text-left pl-7 pr-4 py-2.5 hover:bg-gray-100 transition-colors flex items-center justify-between gap-2 ${activeChat?.room.roomId === room.roomId ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="min-w-0">
                              <p className="text-[10px] font-medium text-gray-800 truncate">{room.nombre}</p>
                              {room.lastMessage && (
                                <p className="text-[9px] text-gray-400 truncate italic">{room.lastMessage}</p>
                              )}
                            </div>
                          </div>
                          {room.unreadCount > 0 && (
                            <span className="shrink-0 w-4 h-4 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                              {room.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div className={`${!activeChat ? 'hidden sm:flex' : 'flex'} flex-1 bg-white border border-gray-200 flex-col overflow-hidden min-w-0`}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="text-sm text-gray-400 font-light">Seleccioná un cliente y una sala</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="sm:hidden text-xs text-blue-600 flex items-center gap-1 shrink-0">
                  ← Volver
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activeChat.client.name}
                    <span className="text-gray-400 font-light ml-2">— {activeChat.room.nombre}</span>
                  </p>
                  <p className="text-xs text-gray-400 truncate">{activeChat.client.email}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && <p className="text-xs text-gray-400 text-center py-8">Sin mensajes aún.</p>}
                {messages.map((m) => {
                  const sender = typeof m.senderId === 'object' ? m.senderId : null
                  const isAdmin = sender
                    ? (sender.role === 'admin' || sender.role === 'superadmin')
                    : m.senderRole === 'admin'
                  return (
                    <div key={m._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 text-sm ${isAdmin ? 'bg-gradient-to-br from-gray-900 to-blue-700 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {!isAdmin && (
                          <p className="text-[10px] font-medium mb-1 text-gray-500">{activeChat.client.name}</p>
                        )}
                        <p className="leading-relaxed">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Escribí un mensaje..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                />
                <button type="submit" disabled={sending || !newMsg.trim()} className="px-4 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-40">
                  ENVIAR
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
