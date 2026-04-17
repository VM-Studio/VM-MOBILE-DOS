'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import useAuth from '@/hooks/useAuth'

interface Notification {
  _id: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

interface Props {
  onMenuClick: () => void
}

export default function ClientNavbar({ onMenuClick }: Props) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showBell, setShowBell] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const token = () => localStorage.getItem('vm_token') || ''

  const fetchNotifications = () => {
    const t = token()
    if (!t) return
    fetch('/api/notifications?limit=10', { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0) })
      .catch(() => { /* silent */ })
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', { method: 'PUT', headers: { Authorization: `Bearer ${token()}` } })
    setUnreadCount(0)
    setNotifications((p) => p.map((n) => ({ ...n, read: true })))
  }

  const handleMarkOneRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token()}` } })
    setNotifications((p) => p.map((n) => n._id === id ? { ...n, read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  // Get current page title from pathname (unused, kept for future use)
  // const title = Object.entries(PAGE_TITLES)...

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'VM'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-4 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title removed */}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setShowBell((p) => !p)}
            className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <p className="text-xs font-medium text-gray-900">Notificaciones</p>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] text-blue-600 hover:underline">Marcar todas como leídas</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">Sin notificaciones.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.read ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                        <div className={!n.read ? '' : 'ml-3.5'}>
                          <p className="text-xs font-medium text-gray-900">{n.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-gray-300">{new Date(n.createdAt).toLocaleDateString('es-AR')}</p>
                            <div className="flex items-center gap-2">
                              {n.link && (
                                <Link href={n.link} onClick={() => { handleMarkOneRead(n._id); setShowBell(false) }} className="text-[10px] text-blue-600 hover:underline">Ver →</Link>
                              )}
                              {!n.read && (
                                <button onClick={() => handleMarkOneRead(n._id)} className="text-[10px] text-gray-400 hover:text-gray-600">✓</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {/* User info */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900 leading-tight">{user?.name ?? '...'}</span>
          <span className="text-[11px] text-gray-400 tracking-wide">{user?.company ?? user?.email ?? ''}</span>
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-900 to-blue-700 flex items-center justify-center shrink-0">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-white">{initials}</span>
          )}
        </div>
      </div>
    </header>
  )
}
