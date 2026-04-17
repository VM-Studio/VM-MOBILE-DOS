'use client'

import Link from 'next/link'

interface Props {
  onMenuClick: () => void
  adminName?: string
  unreadMessages?: number
}

export default function AdminNavbar({ onMenuClick, adminName, unreadMessages = 0 }: Props) {
  const initials = adminName
    ? adminName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A'

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

        {/* Messages bell */}
        <Link href="/admin/mensajes" className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Mensajes">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {unreadMessages > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </span>
          )}
        </Link>

        {/* Admin name */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900 leading-tight">{adminName ?? 'Admin'}</span>
          <span className="text-[11px] text-gray-400 tracking-wide">Administrador</span>
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-900 to-blue-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>
      </div>
    </header>
  )
}
