'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DownloadPDFButton from '@/components/pdf/DownloadPDFButton'
import { useProject } from '@/lib/hooks/useProjects'
import ProjectPreview from '@/components/client/dashboard/ProjectPreview'
import ClosingSignatureModal from '@/components/client/proyecto/ClosingSignatureModal'
import useAuth from '@/hooks/useAuth'

interface Stage {
  _id: string; name: string; order: number; status: string; description?: string
  requiresApproval: boolean; approvedAt?: string; rejectedAt?: string; rejectionComment?: string
}
interface FileItem { _id: string; name: string; url: string; category: string; uploadedAt: string }
interface Update { message: string; createdAt: string }

const STAGE_COLORS: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-500 border-gray-200',
  en_progreso: 'bg-blue-50 text-blue-700 border-blue-300',
  en_revision: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  completado: 'bg-green-50 text-green-700 border-green-300',
  rechazado: 'bg-red-50 text-red-600 border-red-300',
}
const STAGE_LABELS: Record<string, string> = {
  pendiente: 'Pendiente', en_progreso: 'En progreso', en_revision: 'En revisión',
  completado: 'Completado', rechazado: 'Rechazado',
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { project, isLoading, refresh } = useProject(id ?? null)
  const [rejectStageId, setRejectStageId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [signedCertUrl, setSignedCertUrl] = useState<string | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('vm_token') : null
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const handleApprove = async (stageId: string) => {
    setActionLoading(true)
    await fetch(`/api/projects/${id}/stages/${stageId}/approve`, { method: 'PUT', headers })
    await refresh()
    setActionLoading(false)
  }

  const handleReject = async () => {
    if (!rejectStageId) return
    setActionLoading(true)
    await fetch(`/api/projects/${id}/stages/${rejectStageId}/reject`, {
      method: 'PUT', headers, body: JSON.stringify({ comment: rejectComment }),
    })
    await refresh()
    setRejectStageId(null)
    setRejectComment('')
    setActionLoading(false)
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full" />
        <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Proyecto no encontrado.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">← Volver</button>
      </div>
    )
  }

  const sortedStages = [...project.stages].sort((a, b) => a.order - b.order)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="text-xs text-gray-400 hover:text-gray-600 mb-3 block">← Volver a proyectos</button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">{project.type}</span>
            <h1 className="mt-1 text-2xl font-light text-gray-900">{project.name}</h1>
            {project.description && <p className="mt-2 text-sm text-gray-500">{project.description}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <DownloadPDFButton
              type="project"
              id={id}
              filename={`VM-Proyecto-${project.name}`}
              variant="outline"
              label="Descargar Resumen PDF"
            />
            {project.previewUrl && (
              <a href={project.previewUrl} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                Ver sitio →
              </a>
            )}
          </div>
        </div>
        {project.startDate && project.estimatedEndDate && (
          <div className="mt-3 flex gap-4 text-xs text-gray-400">
            <span>Inicio: {new Date(project.startDate).toLocaleDateString('es-AR')}</span>
            <span>Entrega estimada: {new Date(project.estimatedEndDate).toLocaleDateString('es-AR')}</span>
          </div>
        )}
      </div>

      {/* Preview en staging */}
      {project.stagingUrl && <ProjectPreview project={project} />}

      {/* ── Firma de cierre ─────────────────────────────────────────── */}
      {/* Éxito: proyecto firmado */}
      {signedCertUrl && (
        <div className="bg-green-50 border border-green-200 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <div>
              <p className="text-sm font-medium text-green-800">¡Documento firmado correctamente!</p>
              <p className="text-xs text-green-600 font-light">El documento de cierre fue guardado. Podés descargarlo desde acá.</p>
            </div>
          </div>
          <a
            href={signedCertUrl}
            download={`Cierre-${project.name}.pdf`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-green-400 text-green-700 hover:bg-green-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            DESCARGAR PDF DE CIERRE
          </a>
        </div>
      )}

      {/* Banner: pendiente de firma */}
      {!signedCertUrl && project.awaitingSignature && !project.closingSignature?.signedAt && (
        <div className="bg-amber-50 border border-amber-300 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 text-xl shrink-0">✍️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Pendiente la firma de finalización</p>
              <p className="text-xs text-amber-600 font-light mt-0.5">
                Tu proyecto está listo. Firmá el documento de cierre para confirmarlo oficialmente.
                Tu sitio continuará alojado de manera indefinida.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSignModal(true)}
            className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-xs font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            FIRMAR AHORA
          </button>
        </div>
      )}

      {/* Banner: ya firmado (sin éxito reciente) */}
      {!signedCertUrl && project.closingSignature?.signedAt && (
        <div className="bg-green-50 border border-green-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm text-green-800 font-medium">
              Documento de cierre firmado el{' '}
              {new Date(project.closingSignature.signedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {project.closingSignature?.certificateUrl && (
            <a
              href={project.closingSignature.certificateUrl}
              download={`Cierre-${project.name}.pdf`}
              className="shrink-0 text-xs text-green-700 border border-green-300 px-3 py-1.5 hover:bg-green-100 transition-colors"
            >
              Descargar PDF →
            </a>
          )}
        </div>
      )}
      {/* Progress */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ PROGRESO GENERAL ]</span>
          <span className="text-3xl font-light text-gray-900">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2">
          <div className="bg-gradient-to-r from-gray-900 to-blue-600 h-2 transition-all duration-500" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      {/* Stages timeline */}
      {sortedStages.length > 0 && (
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase block mb-4">[ ETAPAS DEL PROYECTO ]</span>
          <div className="space-y-3">
            {sortedStages.map((stage: Stage) => (
              <div key={stage._id} className={`bg-white border p-5 ${STAGE_COLORS[stage.status]}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-lg font-light text-gray-300 leading-none">{String(stage.order).padStart(2, '0')}</span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{stage.name}</h3>
                      {stage.description && <p className="mt-1 text-xs text-gray-500">{stage.description}</p>}
                      {stage.rejectionComment && (
                        <p className="mt-1 text-xs text-red-500">Motivo: {stage.rejectionComment}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase shrink-0 border ${STAGE_COLORS[stage.status]}`}>
                    {STAGE_LABELS[stage.status]}
                  </span>
                </div>
                {/* Approval buttons */}
                {stage.requiresApproval && stage.status === 'en_revision' && (
                  <div className="mt-4 flex gap-3">
                    <button onClick={() => handleApprove(stage._id)} disabled={actionLoading}
                      className="px-4 py-2 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
                      ✓ APROBAR ETAPA
                    </button>
                    <button onClick={() => setRejectStageId(stage._id)} disabled={actionLoading}
                      className="px-4 py-2 text-xs font-medium border border-red-400 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      ✕ RECHAZAR
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {project.files.length > 0 && (
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase block mb-4">[ ARCHIVOS ]</span>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {project.files.map((f: FileItem) => (
              <a key={f._id} href={f.url} target="_blank" rel="noopener noreferrer"
                className="bg-white border border-gray-200 p-4 flex items-center gap-3 hover:border-blue-400 transition-colors group">
                <svg className="w-8 h-8 text-gray-300 group-hover:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{f.category}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Updates log */}
      {project.updates.length > 0 && (
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase block mb-4">[ ACTUALIZACIONES ]</span>
          <div className="space-y-2">
            {[...project.updates].reverse().map((u: Update, i: number) => (
              <div key={i} className="flex gap-3 bg-white border border-gray-100 p-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{u.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(u.createdAt).toLocaleString('es-AR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectStageId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-md w-full">
            <h3 className="text-base font-medium text-gray-900 mb-2">Rechazar etapa</h3>
            <p className="text-sm text-gray-500 mb-4">Explicá brevemente el motivo del rechazo.</p>
            <textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)}
              className="w-full border border-gray-200 p-3 text-sm resize-none h-24 focus:outline-none focus:border-blue-400"
              placeholder="Ej: El diseño no refleja nuestra identidad visual..." />
            <div className="mt-4 flex gap-3">
              <button onClick={handleReject} disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                CONFIRMAR RECHAZO
              </button>
              <button onClick={() => { setRejectStageId(null); setRejectComment('') }}
                className="flex-1 py-2.5 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firma de cierre modal */}
      {showSignModal && (
        <ClosingSignatureModal
          project={project}
          clientName={user?.name ?? ''}
          onSigned={(certUrl) => {
            setSignedCertUrl(certUrl)
            setShowSignModal(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}
