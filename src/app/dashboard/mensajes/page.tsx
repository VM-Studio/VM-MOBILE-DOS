'use client'

import { useRef, useState } from 'react'
import { useRooms, useMessages } from '@/lib/hooks/useMessages'

interface Room {
  roomId: string
  nombre: string
  descripcion: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

interface ChatMessage {
  _id: string
  content: string
  createdAt: string
  senderRole: string
  isOwn: boolean
  senderName: string
  senderAvatar: string
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

function VMAvatarIcon() {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
      style={{ backgroundColor: '#0F172A' }}>
      VM
    </div>
  )
}

export default function MensajesPage() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const { rooms, isLoading: loadingRooms, refresh: refreshRooms } = useRooms()
  const { messages, isLoading: loadingMessages, refresh: refreshMessages } = useMessages(selectedRoom?.roomId ?? null)

  const send = async () => {
    if (!input.trim() || !selectedRoom) return
    setSending(true)
    const token = localStorage.getItem('vm_token')
    const res = await fetch(`/api/messages/${selectedRoom.roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: input.trim() }),
    })
    if (res.ok) {
      setInput('')
      refreshMessages()
      refreshRooms()
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSending(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ MENSAJES ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Mensajes</h1>
      </div>

      <div className="flex h-[calc(100vh-220px)] bg-white border border-gray-200 overflow-hidden">
        {/* Rooms list */}
        <div className={`${selectedRoom ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 border-r border-gray-100 flex-col flex-shrink-0`}>
          <div className="p-3 border-b border-gray-100">
            <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">Conversaciones</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingRooms
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="mx-3 my-2 h-20" />)
              : (rooms as Room[]).map((r) => (
                <button
                  key={r.roomId}
                  onClick={() => setSelectedRoom(r)}
                  className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedRoom?.roomId === r.roomId ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-900 truncate">{r.nombre}</p>
                        {r.unreadCount > 0 && (
                          <span className="shrink-0 bg-blue-600 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {r.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{r.descripcion}</p>
                      {r.lastMessage && (
                        <p className="text-[10px] text-gray-500 truncate mt-1 italic">{r.lastMessage}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Chat window */}
        <div className={`${!selectedRoom ? 'hidden sm:flex' : 'flex'} flex-1 flex-col min-w-0`}>
          {!selectedRoom ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-400">Seleccioná una conversación</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <button onClick={() => setSelectedRoom(null)} className="sm:hidden text-xs text-blue-600 flex items-center gap-1 shrink-0">
                  ← Volver
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{selectedRoom.nombre}</p>
                  <p className="text-[10px] text-gray-400">{selectedRoom.descripcion}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages
                  ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-2/3" />)
                  : messages.length === 0
                    ? <p className="text-xs text-gray-400 text-center mt-8">Ningún mensaje aún. ¡Enviá el primero!</p>
                  : (messages as ChatMessage[]).map((m, index, arr) => {
                        const isOwn = m.isOwn
                        const msgDate = new Date(m.createdAt)
                        const today = new Date()
                        const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
                        const sameDay = (a: Date, b: Date) =>
                          a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
                        const prevMsg = arr[index - 1]
                        const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null
                        const showDateSeparator = !prevDate || !sameDay(msgDate, prevDate)
                        const dateLabel = sameDay(msgDate, today)
                          ? 'Hoy'
                          : sameDay(msgDate, yesterday)
                            ? 'Ayer'
                            : msgDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                        return (
                          <div key={m._id}>
                            {showDateSeparator && (
                              <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[10px] font-medium tracking-wider text-gray-400 uppercase px-2 shrink-0">
                                  {dateLabel}
                                </span>
                                <div className="flex-1 h-px bg-gray-100" />
                              </div>
                            )}
                            <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              {!isOwn && <VMAvatarIcon />}
                              <div className={`max-w-[70%]`}>
                                {!isOwn && (
                                  <p className="text-[10px] font-semibold text-gray-600 mb-1 ml-1">{m.senderName}</p>
                                )}
                                <div className={`px-3 py-2 text-xs ${isOwn ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                                  <p>{m.content}</p>
                                  <p className={`text-[9px] mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 p-3 flex gap-2">
                <input
                  className="flex-1 text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:border-blue-400 placeholder-gray-400"
                  placeholder="Escribí un mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="bg-gradient-to-r from-gray-900 to-blue-700 text-white text-[10px] font-medium tracking-widest uppercase px-4 py-2 disabled:opacity-50 transition-opacity">
                  {sending ? '...' : 'Enviar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
