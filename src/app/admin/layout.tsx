'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminNavbar from '@/components/admin/layout/AdminNavbar'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState(0)

  const fetchUnread = useCallback(() => {
    const token = localStorage.getItem('vm_token')
    if (!token) return
    fetch('/api/admin/messages/unread', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setUnreadMessages(d.unread ?? 0) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('vm_token')
    const userData = localStorage.getItem('vm_user')

    if (!token || !userData) {
      router.replace('/login')
      return
    }

    try {
      const user = JSON.parse(userData) as AdminUser
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        router.replace('/unauthorized')
        return
      }
      setAdmin(user)
    } catch {
      router.replace('/login')
      return
    }

    setLoading(false)
  }, [router])

  // Poll unread count every 30 seconds once admin is loaded
  useEffect(() => {
    if (!admin) return
    fetchUnread()
    const interval = setInterval(fetchUnread, 30_000)
    return () => clearInterval(interval)
  }, [admin, fetchUnread])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-light">Cargando panel...</span>
        </div>
      </div>
    )
  }

  if (!admin) return null

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} unreadMessages={unreadMessages} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuClick={() => setSidebarOpen(true)} adminName={admin.name} unreadMessages={unreadMessages} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
