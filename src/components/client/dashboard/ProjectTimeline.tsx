'use client'

import { useState } from 'react'
import { format, isPast } from 'date-fns'

// ─── Estilos por estado de etapa ──────────────────────────────────────────────
const STAGE_STYLES: Record<string, {
  dot: string
  label: string
  icon: React.ReactNode
}> = {
  completado: {
    dot: 'bg-[#2563EB] border-[#2563EB]',
    label: 'text-[#2563EB]',
    icon: <span className="text-white text-[10px] font-bold">✓</span>,
  },
  en_progreso: {
    dot: 'bg-white border-[#2563EB] ring-2 ring-[#2563EB] ring-offset-1',
    label: 'text-[#2563EB]',
    icon: <span className="text-[#2563EB] text-[10px] font-bold">⟳</span>,
  },
  en_revision: {
    dot: 'bg-yellow-400 border-yellow-400',
    label: 'text-yellow-600',
    icon: <span className="text-white text-[10px] font-bold">!</span>,
  },
  rechazado: {
    dot: 'bg-red-500 border-red-500',
    label: 'text-red-500',
    icon: <span className="text-white text-[10px] font-bold">✕</span>,
  },
  pendiente: {
    dot: 'bg-white border-gray-300',
    label: 'text-gray-400',
    icon: null,
  },
}

// ─── Badge del estado general del proyecto ────────────────────────────────────
const STATUS_BADGE: Record<string, { text: string; color: string }> = {
  en_progreso: { text: 'EN PROGRESO', color: 'bg-blue-100 text-blue-700' },
  en_revision: { text: 'EN REVISIÓN', color: 'bg-yellow-100 text-yellow-700' },
  completado:  { text: 'COMPLETADO',  color: 'bg-green-100 text-green-700' },
  pausado:     { text: 'PAUSADO',     color: 'bg-gray-100 text-gray-500' },
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stage {
  _id: string
  name: string
  order: number
  status: 'completado' | 'en_progreso' | 'en_revision' | 'rechazado' | 'pendiente'
  completedAt?: string
  requiresApproval?: boolean
  rejectionComment?: string
}

interface Project {
  _id: string
  name: string
  type?: string
  status: string
  progress: number
  startDate?: string
  estimatedEndDate?: string
  stages?: Stage[]
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ProjectTimeline({ project, onRefresh }: { project: Project; onRefresh?: () => void }) {
  const [rejectStageId, setRejectStageId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const badge = STATUS_BADGE[project.status] ?? STATUS_BADGE.en_progreso

  // Ordenar etapas por order
  const stages = [...(project.stages ?? [])].sort((a, b) => a.order - b.order)

  // Primera etapa que no está completada ni rechazada
  const activeIndex = stages.findIndex(
    (s) => s.status !== 'completado' && s.status !== 'rechazado'
  )

  // Etapas que necesitan aprobación del cliente ahora mismo
  const pendingApprovals = stages.filter(
    (s) => s.requiresApproval && s.status === 'en_revision'
  )

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('vm_token') ?? '' : ''

  const handleApprove = async (stageId: string) => {
    setActionLoading(true)
    await fetch(`/api/projects/${project._id}/stages/${stageId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
    })
    setActionLoading(false)
    onRefresh?.()
  }

  const handleReject = async () => {
    if (!rejectStageId) return
    setActionLoading(true)
    await fetch(`/api/projects/${project._id}/stages/${rejectStageId}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: rejectComment }),
    })
    setActionLoading(false)
    setRejectStageId(null)
    setRejectComment('')
    onRefresh?.()
  }

  return (
    <div className="bg-white border border-gray-200 p-5 mb-3 last:mb-0">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-0.5">
            {project.type ?? 'PROYECTO'}
          </p>
          <h3 className="text-sm font-semibold text-[#0F172A]">
            {project.name}
          </h3>
        </div>
        <span className={`text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-sm uppercase ${badge.color}`}>
          {badge.text}
        </span>
      </div>

      {/* ── Fechas ── */}
      {(project.startDate || project.estimatedEndDate) && (
        <p className="text-xs text-gray-400 mb-4">
          {project.startDate && (
            <span>Inició {format(new Date(project.startDate), 'dd/MM/yyyy')}</span>
          )}
          {project.startDate && project.estimatedEndDate && ' · '}
          {project.estimatedEndDate && (
            <span>
              Entrega estimada{' '}
              <span className={
                isPast(new Date(project.estimatedEndDate)) && project.status !== 'completado'
                  ? 'text-red-500 font-medium'
                  : ''
              }>
                {format(new Date(project.estimatedEndDate), 'dd/MM/yyyy')}
              </span>
            </span>
          )}
        </p>
      )}

      {/* ── Timeline de etapas ── */}
      {stages.length > 0 && (
        <div className="mb-4 overflow-x-auto pb-1">
          <div className="flex items-start min-w-max">
            {stages.map((stage, index) => {
              const style = STAGE_STYLES[stage.status] ?? STAGE_STYLES.pendiente
              const isLast = index === stages.length - 1
              const isActive = index === activeIndex
              const nextCompleted = stages[index + 1]?.status !== 'pendiente'

              return (
                <div key={stage._id} className="flex items-start">

                  {/* Nodo + label */}
                  <div className="flex flex-col items-center" style={{ minWidth: 72 }}>

                    {/* Dot */}
                    <div className={`
                      w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 relative
                      transition-transform
                      ${style.dot}
                      ${isActive ? 'scale-110' : ''}
                    `}>
                      {style.icon}
                    </div>

                    {/* Nombre de etapa */}
                    <p className={`text-center mt-1.5 text-[10px] font-medium leading-tight max-w-[68px] ${style.label}`}>
                      {stage.name}
                    </p>

                    {/* Fecha si está completada */}
                    {stage.completedAt && (
                      <p className="text-[9px] text-gray-300 mt-0.5 text-center">
                        {format(new Date(stage.completedAt), 'dd/MM')}
                      </p>
                    )}
                  </div>

                  {/* Línea conectora */}
                  {!isLast && (
                    <div className="flex items-center" style={{ marginTop: 13 }}>
                      <div
                        className="h-0.5 w-8"
                        style={{
                          backgroundColor: nextCompleted ? '#2563EB' : '#E5E7EB',
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Barra de progreso ── */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
            Progreso general
          </p>
          <p className="text-xs font-semibold text-[#0F172A]">
            {project.progress ?? 0}%
          </p>
        </div>
        <div className="w-full bg-gray-100 h-1.5">
          <div
            className="h-1.5 bg-gradient-to-r from-[#0F172A] to-[#2563EB] transition-all duration-700"
            style={{ width: `${project.progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* ── Etapa activa al pie ── */}
      {activeIndex >= 0 && (
        <p className="text-xs text-gray-400 mt-3">
          Etapa actual:{' '}
          <span className="font-medium text-[#0F172A]">
            {stages[activeIndex]?.name}
          </span>
        </p>
      )}

      {/* ── Etapas pendientes de aprobación ── */}
      {pendingApprovals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <p className="text-[10px] font-medium tracking-widest text-yellow-600 uppercase mb-3">
            [ REQUIERE TU APROBACIÓN ]
          </p>
          <div className="space-y-3">
            {pendingApprovals.map((stage) => (
              <div key={stage._id} className="bg-yellow-50 border border-yellow-200 p-4">
                <p className="text-sm font-medium text-[#0F172A]">{stage.name}</p>
                {stage.rejectionComment && (
                  <p className="mt-1 text-xs text-red-500">Motivo anterior: {stage.rejectionComment}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleApprove(stage._id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    ✓ APROBAR
                  </button>
                  <button
                    onClick={() => setRejectStageId(stage._id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-medium border border-red-400 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    ✕ RECHAZAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal de rechazo ── */}
      {rejectStageId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setRejectStageId(null)}
        >
          <div
            className="w-full max-w-sm bg-white border border-gray-200 p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-[#0F172A]">Rechazar etapa</h3>
            <p className="text-xs text-gray-500">
              Indicá el motivo para que el equipo pueda corregirlo.
            </p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Ej: El diseño no refleja lo acordado..."
              rows={3}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectComment.trim()}
                className="flex-1 py-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirmar rechazo
              </button>
              <button
                onClick={() => { setRejectStageId(null); setRejectComment('') }}
                className="px-4 py-2 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
