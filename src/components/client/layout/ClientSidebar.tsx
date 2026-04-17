'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import useAuth from '@/hooks/useAuth'

const NAV_ITEMS = [
  {
    href: '/dashboard/proyectos',
    label: 'Mi Proyecto',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/mensajes',
    label: 'Mensajes',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/facturacion',
    label: 'Facturación',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/soporte',
    label: 'Soporte',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/perfil',
    label: 'Mi Perfil',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function ClientSidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [unreadMessages, setUnreadMessages] = useState(0)

  const fetchUnread = useCallback(() => {
    const token = localStorage.getItem('vm_token')
    if (!token) return
    fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setUnreadMessages(d.totalUnread ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 w-64 bg-white border-r border-gray-200
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-center px-4 py-3 border-b border-gray-100">
          <Link href="/" className="flex items-center">
            <Image src="/vm2.png" alt="VM Studio" width={140} height={40} className="object-contain" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors
                ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.href === '/dashboard/mensajes' && unreadMessages > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-[10px] font-medium px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom: logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
