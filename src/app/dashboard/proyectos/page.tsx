'use client'

import Link from 'next/link'
import useAuth from '@/hooks/useAuth'
import { useMyProjects } from '@/lib/hooks/useProjects'
import { useMyInvoices } from '@/lib/hooks/useInvoices'
import { useRooms } from '@/lib/hooks/useMessages'
import ProjectPreview from '@/components/client/dashboard/ProjectPreview'
import ProjectTimeline from '@/components/client/dashboard/ProjectTimeline'
import ClosingCertificate from '@/components/client/dashboard/ClosingCertificate'
import ClosingSignatureModal from '@/components/client/proyecto/ClosingSignatureModal'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

function KpiCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium tracking-[0.18em] text-gray-400 uppercase">{label}</p>
          <p className="mt-1 text-2xl font-light text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className="w-10 h-10 bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function MiProyectoPage() {
  const { user } = useAuth()
  const { projects, refresh: refreshProjects } = useMyProjects()
  const { invoices } = useMyInvoices()
  const { totalUnread } = useRooms()

  const loaded = true

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const activeProjects = projects.filter((p: { status: string }) => p.status === 'en_progreso' || p.status === 'en_revision')
  const completedProjects = projects.filter((p: { status: string }) => p.status === 'completado')
  const visibleProjects = [...activeProjects, ...completedProjects]
  const pendingInvoices = invoices.filter((i: { status: string; amount: number }) => i.status === 'pendiente')
  const previewProject = visibleProjects.find((p: { stagingUrl?: string | null; previewUrl?: string | null }) => p.stagingUrl || p.previewUrl) ?? null

  // Firma digital — proyecto que espera ser firmado por el cliente
  const projectPendingSignature = projects.find(
    (p: { awaitingSignature?: boolean }) => p.awaitingSignature === true
  ) ?? null

  // Proyectos ya firmados (certificados disponibles)
  const signedProjects = projects.filter(
    (p: { closingSignature?: { signedAt?: string | null } | null }) =>
      p.closingSignature?.signedAt
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Greeting */}
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ MI PROYECTO ]</span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-light text-gray-900">
          {greeting()},{' '}
          <span className="font-medium bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
            {user?.name?.split(' ')[0] ?? 'cliente'}
          </span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Aquí tenés un resumen de tu cuenta.</p>
      </div>

      {/* Certificados de proyectos firmados */}
      {signedProjects.map((p: { _id: string; name: string; type?: string; closingSignature?: { signedAt?: string | null; certificateUrl?: string | null } | null }) => (
        <ClosingCertificate key={p._id} project={p} />
      ))}

      {/* Project preview */}
      {previewProject && <ProjectPreview project={previewProject} compact />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!loaded ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard label="Proyectos activos" value={activeProjects.length} sub={`${projects.length} en total`}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
            <KpiCard label="Facturas pendientes" value={pendingInvoices.length}
              sub={pendingInvoices.length > 0 ? `$${pendingInvoices.reduce((a: number, i: { amount: number }) => a + i.amount, 0).toLocaleString()}` : 'Al día'}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
            <KpiCard label="Mensajes sin leer" value={totalUnread} sub={totalUnread > 0 ? 'Tenés mensajes nuevos' : 'Todo leído'}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>} />
          </>
        )}
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ MIS PROYECTOS ]</span>
        </div>
        {!loaded ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : visibleProjects.length === 0 ? (
          <div className="bg-white border border-gray-200 p-8 text-center text-sm text-gray-400">No tenés proyectos por el momento.</div>
        ) : (
          <div className="flex flex-col">
            {visibleProjects.map((p: { _id: string; name: string; type?: string; status: string; progress: number; startDate?: string; estimatedEndDate?: string; stages?: { _id: string; name: string; order: number; status: 'completado' | 'en_progreso' | 'en_revision' | 'rechazado' | 'pendiente'; completedAt?: string; requiresApproval?: boolean; rejectionComment?: string }[] }) => (
              <ProjectTimeline key={p._id} project={p} onRefresh={refreshProjects} />
            ))}
          </div>
        )}
      </div>

      {/* Quick access */}
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase block mb-4">[ ACCESOS RÁPIDOS ]</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: '/dashboard/mensajes', label: 'Mensajes', badge: totalUnread },
            { href: '/dashboard/soporte', label: 'Soporte', badge: 0 },
            { href: '/dashboard/perfil', label: 'Mi Perfil', badge: 0 },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="bg-white border border-gray-200 p-4 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-between">
              {item.label}
              {item.badge > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Modal de firma digital — aparece SOLO si hay un proyecto esperando firma */}
      {projectPendingSignature && (
        <ClosingSignatureModal
          project={projectPendingSignature as { _id: string; name: string; type?: string; closingSignature?: { adminSignatureData?: string | null; adminName?: string | null } | null }}
          clientName={user?.name ?? 'Cliente'}
          onSigned={() => { refreshProjects() }}
        />
      )}
    </div>
  )
}
