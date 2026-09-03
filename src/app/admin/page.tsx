'use client'

import Link from 'next/link'
import { useAdminStats } from '@/lib/hooks/useDashboard'

const statusColors: Record<string, string> = {
  en_progreso: 'bg-blue-100 text-blue-700',
  en_revision: 'bg-amber-100 text-amber-700',
  completado: 'bg-green-100 text-green-700',
  pausado: 'bg-gray-100 text-gray-600',
}
const statusLabels: Record<string, string> = {
  en_progreso: 'En progreso',
  en_revision: 'En revisión',
  completado: 'Completado',
  pausado: 'Pausado',
}

export default function AdminPage() {
  const { stats, isLoading: loading } = useAdminStats()

  const kpis = stats ? [
    { label: 'Clientes', value: stats.totalClients, href: '/admin/clientes' },
    { label: 'Proyectos activos', value: stats.activeProjects, href: '/admin/proyectos' },
    { label: 'Facturas pendientes', value: stats.pendingInvoices, href: '/admin/facturacion' },
    { label: 'Tickets abiertos', value: stats.openTickets, href: '/admin/soporte' },
    { label: 'Ingresos totales', value: `$${stats.totalRevenue.toLocaleString('es-AR')}`, href: '/admin/facturacion' },
  ] : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ PANEL ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Resumen general</h1>
        <p className="mt-1 text-sm text-gray-500 font-light">Visión global del negocio en tiempo real.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Link key={kpi.label} href={kpi.href}
              className="group bg-white border border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.18em] text-gray-400 uppercase">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-light text-gray-900">{kpi.value}</p>
                </div>
                
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ PROYECTOS RECIENTES ]</span>
            <Link href="/admin/proyectos" className="text-xs text-blue-600 hover:underline">Ver todos →</Link>
          </div>
          {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 animate-pulse" />)}</div>
            : !stats?.recentProjects?.length ? <p className="text-sm text-gray-400">No hay proyectos aún.</p>
            : <div className="space-y-2">{stats.recentProjects.map((p: { _id: string; name: string; status: string; progress: number; clientId: { name: string; company?: string } }) => (
              <Link key={p._id} href={`/admin/proyectos/${p._id}`}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 hover:border-l-2 hover:border-blue-400 transition-all group">
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.clientId?.company || p.clientId?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{p.progress}%</span>
                  <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>{statusLabels[p.status] || p.status}</span>
                </div>
              </Link>
            ))}</div>}
        </div>
      </div>
    </div>
  )
}
