'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import ClientSidebar from '@/components/client/layout/ClientSidebar'
import ClientNavbar from '@/components/client/layout/ClientNavbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 tracking-wider">Cargando panel...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <ClientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
