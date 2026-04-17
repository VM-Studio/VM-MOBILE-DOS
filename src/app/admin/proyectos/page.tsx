'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminProjects } from '@/lib/hooks/useProjects'

interface Project {
  _id: string
  name: string
  status: string
  progress: number
  type?: string
  clientId: { _id: string; name: string; company?: string }
  createdAt: string
}

const statusColors: Record<string, string> = {
  en_progreso: 'bg-blue-50 text-blue-700',
  en_revision: 'bg-amber-50 text-amber-700',
  completado: 'bg-green-50 text-green-700',
  pausado: 'bg-gray-100 text-gray-600',
}
const statusLabels: Record<string, string> = {
  en_progreso: 'En progreso',
  en_revision: 'En revisión',
  completado: 'Completado',
  pausado: 'Pausado',
}

export default function AdminProyectosPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const filters = new URLSearchParams()
  if (debouncedSearch) filters.set('search', debouncedSearch)
  if (filterStatus) filters.set('status', filterStatus)
  filters.set('limit', '30')

  const { projects, total, isLoading: loading } = useAdminProjects(filters.toString())

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ PROYECTOS ]</span>
          <h1 className="mt-2 text-2xl font-light text-gray-900">Gestión de proyectos</h1>
          <p className="mt-1 text-sm text-gray-500 font-light">{total} proyectos</p>
        </div>
        <Link
          href="/admin/proyectos/nuevo"
          className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-center"
        >
          + NUEVO PROYECTO
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition-colors"
        >
          <option value="">Todos los estados</option>
          <option value="en_progreso">En progreso</option>
          <option value="en_revision">En revisión</option>
          <option value="completado">Completado</option>
          <option value="pausado">Pausado</option>
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 animate-pulse" />)}
        </div>
      ) : !projects.length ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <p className="text-sm text-gray-400 font-light">No hay proyectos que coincidan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: Project) => (
            <Link key={p._id} href={`/admin/proyectos/${p._id}`} className="group bg-white border border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabels[p.status] || p.status}
                </span>
                {p.type && <span className="text-[10px] text-gray-400 uppercase tracking-wider">{p.type}</span>}
              </div>
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</h3>
              <p className="text-xs text-gray-400 font-light mt-1">{p.clientId?.company || p.clientId?.name}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Progreso</span>
                  <span className="text-xs font-medium text-gray-700">{p.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3">{new Date(p.createdAt).toLocaleDateString('es-AR')}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
