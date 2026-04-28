'use client'

import { useState } from 'react'
import { format, isPast } from 'date-fns'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrae una palabra clave del nombre de la etapa */
function getKeyword(name: string): string {
  const skip = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'e', 'o', 'con', 'en', 'a', 'al'])
  const words = name.split(/\s+/)
  const keyword = words.find(w => !skip.has(w.toLowerCase()) && w.length > 2) ?? words[0]
  const cap = keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase()
  return cap.length > 12 ? cap.slice(0, 11) + '…' : cap
}

// ─── Configuración visual por estado ─────────────────────────────────────────
const STAGE_CONFIG: Record<string, {
  ring: string
  bg: string
  icon: string
  textColor: string
  labelColor: string
  lineColor: string
}> = {
  completado: {
    ring: '',
    bg: '',
    icon: '✓',
    textColor: 'text-white',
    labelColor: 'text-[#2563EB]',
    lineColor: '#2563EB',
  },
  en_revision: {
    ring: '',
    bg: 'bg-amber-400',
    icon: '⟳',
    textColor: 'text-white',
    labelColor: 'text-amber-500',
    lineColor: '#FBBF24',
  },
  en_progreso: {
    ring: '',
    bg: '',
    icon: '',
    textColor: '',
    labelColor: 'text-[#2563EB]',
    lineColor: '#E5E7EB',
  },
  rechazado: {
    ring: '',
    bg: 'bg-red-400',
    icon: '✕',
    textColor: 'text-white',
    labelColor: 'text-red-400',
    lineColor: '#E5E7EB',
  },
  pendiente: {
    ring: '',
    bg: 'bg-gray-200',
    icon: '',
    textColor: '',
    labelColor: 'text-gray-300',
    lineColor: '#E5E7EB',
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

// ─── Orden de prioridad: completadas/revisión primero ────────────────────────
const STATUS_SORT_PRIORITY: Record<string, number> = {
  en_revision: 0,
  completado:  1,
  en_progreso: 2,
  rechazado:   3,
  pendiente:   4,
}

// ─── StageNode ────────────────────────────────────────────────────────────────
// ─── StageNode ────────────────────────────────────────────────────────────────
function StageNode({ stage, isLast, nextLineColor, isSelected, onSelect }: {
  stage: Stage
  isLast: boolean
  nextLineColor: string
  isSelected: boolean
  onSelect: (id: string | null) => void
}) {
  const cfg = STAGE_CONFIG[stage.status] ?? STAGE_CONFIG.pendiente
  const keyword = getKeyword(stage.name)
  const hasMore = stage.name.trim().length > 15

  return (
    <div className="flex items-start">
      {/* Nodo */}
      <div className="flex flex-col items-center" style={{ minWidth: 52 }}>

        {/* Círculo */}
        <div className={`
          w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
          transition-all duration-200
          ${stage.status === 'completado' || stage.status === 'en_progreso'
            ? 'bg-gradient-to-br from-[#0F172A] to-[#2563EB]'
            : cfg.bg
          }
        `}>
          {stage.status === 'en_progreso' ? (
            <span className="w-1.5 h-1.5 rounded-full bg-white block animate-pulse" />
          ) : stage.status === 'pendiente' ? (
            <span className="w-1 h-1 rounded-full bg-gray-400 block" />
          ) : (
            <span className={`text-[8px] font-bold leading-none ${cfg.textColor}`}>
              {cfg.icon}
            </span>
          )}
        </div>

        {/* Keyword */}
        <p className={`text-center mt-1 text-[9px] font-semibold leading-tight max-w-[48px] tracking-wide ${
          isSelected ? 'text-[#2563EB]' : cfg.labelColor
        }`}>
          {keyword}
        </p>

        {/* Fecha colapsada */}
        {stage.completedAt && (
          <p className="text-[8px] text-gray-300 mt-0.5 text-center">
            {format(new Date(stage.completedAt), 'dd/MM')}
          </p>
        )}

        {/* Botón VER MÁS */}
        {hasMore && (
          <button
            onClick={() => onSelect(isSelected ? null : stage._id)}
            className={`mt-1 text-[8px] font-semibold tracking-widest leading-tight transition-colors uppercase ${
              isSelected ? 'text-[#2563EB]' : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            {isSelected ? 'CERRAR' : 'VER MÁS'}
          </button>
        )}
      </div>

      {/* Línea conectora */}
      {!isLast && (
        <div className="flex items-center flex-shrink-0" style={{ marginTop: 9 }}>
          <div className="h-px w-5 transition-colors duration-300" style={{ backgroundColor: nextLineColor }} />
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ProjectTimeline({ project, onRefresh }: { project: Project; onRefresh?: () => void }) {
  const [rejectStageId, setRejectStageId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)

  const badge = STATUS_BADGE[project.status] ?? STATUS_BADGE.en_progreso

  // Completadas/en_revision primero, luego por orden original
  const stages = [...(project.stages ?? [])].sort((a, b) => {
    const pa = STATUS_SORT_PRIORITY[a.status] ?? 4
    const pb = STATUS_SORT_PRIORITY[b.status] ?? 4
    if (pa !== pb) return pa - pb
    return a.order - b.order
  })

  // Primera etapa activa (no completada ni rechazada)
  const activeStage = stages.find(
    (s) => s.status !== 'completado' && s.status !== 'rechazado'
  )

  // Etapas que necesitan aprobación del cliente
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
        <div className="mb-5">
          <div className="overflow-x-auto pb-2">
            <div className="flex items-start min-w-max">
              {stages.map((stage, index) => {
                const isLast = index === stages.length - 1
                const nextStage = stages[index + 1]
                const nextLineColor = nextStage
                  ? (STAGE_CONFIG[nextStage.status]?.lineColor ?? '#E5E7EB')
                  : '#E5E7EB'
                return (
                  <StageNode
                    key={stage._id}
                    stage={stage}
                    isLast={isLast}
                    nextLineColor={nextLineColor}
                    isSelected={selectedStageId === stage._id}
                    onSelect={setSelectedStageId}
                  />
                )
              })}
            </div>
          </div>

          {/* Panel detalle — se expande dentro de la tarjeta */}
          {selectedStageId && (() => {
            const sel = stages.find(s => s._id === selectedStageId)
            if (!sel) return null
            const cfg = STAGE_CONFIG[sel.status] ?? STAGE_CONFIG.pendiente
            const dotColor =
              sel.status === 'completado' ? 'bg-[#2563EB]' :
              sel.status === 'en_revision' ? 'bg-amber-400' :
              sel.status === 'en_progreso' ? 'bg-blue-400' :
              sel.status === 'rechazado'   ? 'bg-red-400'   : 'bg-gray-300'
            return (
              <div className="mt-2 border border-gray-100 rounded-lg p-3 bg-gray-50 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                    <span className="text-[8px] uppercase tracking-widest text-gray-400 font-semibold">
                      {sel.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedStageId(null)}
                    className="text-[9px] font-semibold tracking-widest text-gray-400 hover:text-gray-600 uppercase transition-colors"
                  >
                    CERRAR
                  </button>
                </div>
                <p className={`text-[12px] font-medium leading-relaxed ${cfg.labelColor}`}>
                  {sel.name}
                </p>
                {sel.completedAt && (
                  <p className="text-[9px] text-gray-400 mt-1.5 pt-1.5 border-t border-gray-200">
                    Completado el {format(new Date(sel.completedAt), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
            )
          })()}
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
      {activeStage && (
        <p className="text-xs text-gray-400 mt-3">
          Etapa actual:{' '}
          <span className="font-medium text-[#0F172A]">
            {activeStage.name}
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
