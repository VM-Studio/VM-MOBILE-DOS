'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import { useMyProjects } from '@/lib/hooks/useProjects'

type TipoMantenimiento = 'mensual_recurrente' | 'puntual'
type EstadoMantenimiento = 'pendiente_aprobacion' | 'activo' | 'pausado' | 'cancelado'

interface CobroHistorial {
  _id: string
  fecha: string
  monto: number
  estado: 'cobrado' | 'pendiente' | 'fallido'
  nota?: string
}

interface MantenimientoData {
  _id: string
  tipo: TipoMantenimiento
  estado: EstadoMantenimiento
  precioMensual: number
  fechaSolicitud: string
  fechaAprobacion?: string | null
  fechaInicio?: string | null
  fechaProximoCobro?: string | null
  fechaCancelacion?: string | null
  motivoCancelacion?: string | null
  notaCliente?: string | null
  notaAdmin?: string | null
  cobrosRealizados: number
  historialCobros: CobroHistorial[]
}

const ESTADO_LABEL: Record<EstadoMantenimiento, { label: string; color: string }> = {
  pendiente_aprobacion: { label: 'Pendiente de aprobación', color: 'amber' },
  activo: { label: 'Activo', color: 'green' },
  pausado: { label: 'Pausado', color: 'gray' },
  cancelado: { label: 'Cancelado', color: 'red' },
}

export default function DashboardMantenimientoPage() {
  const router = useRouter()
  const { token } = useAuth()
  const { projects } = useMyProjects()

  const [loading, setLoading] = useState(true)
  const [projectStatus, setProjectStatus] = useState<string | null>(null)
  const [mantenimiento, setMantenimiento] = useState<MantenimientoData | null | undefined>(undefined)

  // Form solicitud
  const [showForm, setShowForm] = useState(false)
  const [tipo, setTipo] = useState<TipoMantenimiento>('mensual_recurrente')
  const [notaCliente, setNotaCliente] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  const projectId = projects?.[0]?._id

  const fetchMantenimiento = async () => {
    if (!token || !projectId) { setLoading(false); return }
    try {
      const res = await fetch(`/api/proyectos/${projectId}/mantenimiento`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setProjectStatus(data.projectStatus)
      setMantenimiento(data.mantenimiento ?? null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMantenimiento() }, [token, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !projectId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/proyectos/${projectId}/mantenimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo, notaCliente }),
      })
      if (res.ok) {
        setShowForm(false)
        setNotaCliente('')
        await fetchMantenimiento()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelar = async () => {
    if (!token || !projectId) return
    setCancelando(true)
    try {
      await fetch(`/api/proyectos/${projectId}/mantenimiento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accion: 'cancelar', motivoCancelacion: 'Cancelado por el cliente.' }),
      })
      setCancelConfirm(false)
      await fetchMantenimiento()
    } finally {
      setCancelando(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  const isCompleted = projectStatus === 'completado'

  return (
    <div className="relative p-4 sm:p-6 lg:p-8 space-y-6 min-h-[60vh]">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ MANTENIMIENTO ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Mantenimiento</h1>
        <p className="mt-1 text-sm text-gray-400 font-light">Gestioná el servicio de mantenimiento de tu proyecto.</p>
      </div>

      {/* ── BLOQUEO: proyecto no completado ──────────────────────────────── */}
      {!isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blur overlay — no se puede cerrar */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
          <div className="relative z-10 max-w-sm w-full mx-4 bg-white border border-gray-200 shadow-2xl p-8 text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mx-auto">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900">Sección bloqueada</h2>
            <p className="text-sm text-gray-500 font-light leading-relaxed">
              Esta sección estará disponible una vez que tu proyecto termine de construirse.
              Cuando el equipo marque el proyecto como completado, podrás solicitar y gestionar el servicio de mantenimiento desde acá.
            </p>
            <div className="flex items-center gap-2 justify-center">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-xs text-blue-500 font-medium tracking-wide">Proyecto en construcción</p>
            </div>
            <button
              onClick={() => router.back()}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENIDO (solo visible si completado) ───────────────────────── */}
      {isCompleted && (
        <>
          {/* Sin mantenimiento — invitar a solicitar */}
          {mantenimiento === null && !showForm && (
            <div className="bg-white border border-gray-200 p-8 text-center space-y-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mx-auto">
                <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-medium text-gray-900">¿Necesitás mantenimiento?</h2>
                <p className="text-sm text-gray-500 font-light mt-1 max-w-sm mx-auto">
                  Podés solicitar el servicio de mantenimiento para modificaciones puntuales o un plan mensual recurrente.
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                SOLICITAR MANTENIMIENTO
              </button>
            </div>
          )}

          {/* Formulario de solicitud */}
          {mantenimiento === null && showForm && (
            <div className="bg-white border border-gray-200 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-900">Solicitar mantenimiento</h2>
                <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
              </div>

              <form onSubmit={handleSolicitar} className="space-y-5">
                {/* Tipo */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-3">¿Qué tipo de mantenimiento necesitás?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Puntual */}
                    <button
                      type="button"
                      onClick={() => setTipo('puntual')}
                      className={`p-4 border text-left transition-all ${tipo === 'puntual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${tipo === 'puntual' ? 'border-blue-500' : 'border-gray-300'}`}>
                          {tipo === 'puntual' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Solo por este mes</p>
                          <p className="text-xs text-gray-500 font-light mt-0.5">Para cambios puntuales. Se cobra una vez y se cierra automáticamente.</p>
                        </div>
                      </div>
                    </button>
                    {/* Mensual recurrente */}
                    <button
                      type="button"
                      onClick={() => setTipo('mensual_recurrente')}
                      className={`p-4 border text-left transition-all ${tipo === 'mensual_recurrente' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${tipo === 'mensual_recurrente' ? 'border-blue-500' : 'border-gray-300'}`}>
                          {tipo === 'mensual_recurrente' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">No sé por cuánto tiempo</p>
                          <p className="text-xs text-gray-500 font-light mt-0.5">Plan mensual recurrente. Se cobra cada mes hasta que lo cancelés.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Nota */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    ¿Qué necesitás modificar o mantener? <span className="text-gray-400 font-light">(opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={notaCliente}
                    onChange={(e) => setNotaCliente(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                    placeholder="Ej: necesito agregar una sección nueva, actualizar imágenes, corregir un error..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {submitting ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Mantenimiento existente */}
          {mantenimiento && (
            <div className="space-y-4">
              {/* Card de estado */}
              <div className="bg-white border border-gray-200 p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-1">Estado del servicio</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        mantenimiento.estado === 'activo' ? 'bg-green-500 animate-pulse' :
                        mantenimiento.estado === 'pendiente_aprobacion' ? 'bg-amber-400 animate-pulse' :
                        mantenimiento.estado === 'pausado' ? 'bg-gray-400' : 'bg-red-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        mantenimiento.estado === 'activo' ? 'text-green-700' :
                        mantenimiento.estado === 'pendiente_aprobacion' ? 'text-amber-700' :
                        mantenimiento.estado === 'pausado' ? 'text-gray-600' : 'text-red-600'
                      }`}>
                        {ESTADO_LABEL[mantenimiento.estado].label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase">Tipo</p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {mantenimiento.tipo === 'mensual_recurrente' ? 'Mensual recurrente' : 'Puntual (un mes)'}
                    </p>
                  </div>
                </div>

                {/* Precio mensual */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase">Precio mensual</p>
                    <p className="text-lg font-light text-gray-900 mt-0.5">${mantenimiento.precioMensual.toLocaleString('es-AR')} <span className="text-xs text-gray-400">ARS</span></p>
                  </div>
                  {mantenimiento.cobrosRealizados > 0 && (
                    <div>
                      <p className="text-[10px] tracking-wider text-gray-400 uppercase">Cobros realizados</p>
                      <p className="text-lg font-light text-gray-900 mt-0.5">{mantenimiento.cobrosRealizados}</p>
                    </div>
                  )}
                  {mantenimiento.fechaProximoCobro && mantenimiento.estado === 'activo' && (
                    <div>
                      <p className="text-[10px] tracking-wider text-gray-400 uppercase">Próximo cobro</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {new Date(mantenimiento.fechaProximoCobro).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Nota pendiente */}
                {mantenimiento.estado === 'pendiente_aprobacion' && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3">
                    <span className="text-amber-500 mt-0.5">⏳</span>
                    <p className="text-sm text-amber-700">Tu solicitud está siendo revisada por el equipo. Te notificaremos cuando sea aprobada.</p>
                  </div>
                )}

                {/* Nota del cliente */}
                {mantenimiento.notaCliente && (
                  <div className="bg-gray-50 border border-gray-100 px-4 py-3">
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase mb-1">Tu nota</p>
                    <p className="text-sm text-gray-600 font-light">{mantenimiento.notaCliente}</p>
                  </div>
                )}

                {/* Nota del admin */}
                {mantenimiento.notaAdmin && (
                  <div className="bg-blue-50 border border-blue-100 px-4 py-3">
                    <p className="text-[10px] tracking-wider text-blue-400 uppercase mb-1">Nota del equipo</p>
                    <p className="text-sm text-blue-700">{mantenimiento.notaAdmin}</p>
                  </div>
                )}

                {/* Cancelación info */}
                {mantenimiento.estado === 'cancelado' && (
                  <div className="bg-red-50 border border-red-100 px-4 py-3 space-y-1">
                    <p className="text-[10px] tracking-wider text-red-400 uppercase">Cancelado el {mantenimiento.fechaCancelacion ? new Date(mantenimiento.fechaCancelacion).toLocaleDateString('es-AR') : '—'}</p>
                    {mantenimiento.motivoCancelacion && <p className="text-sm text-red-600">{mantenimiento.motivoCancelacion}</p>}
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-2 text-xs text-blue-600 hover:underline"
                    >
                      Solicitar un nuevo mantenimiento →
                    </button>
                  </div>
                )}
              </div>

              {/* Historial de cobros */}
              {mantenimiento.historialCobros.length > 0 && (
                <div className="bg-white border border-gray-200 p-5 space-y-3">
                  <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">Historial de cobros</p>
                  <div className="space-y-2">
                    {mantenimiento.historialCobros.slice().reverse().map((cobro, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm text-gray-700">{new Date(cobro.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          {cobro.nota && <p className="text-xs text-gray-400">{cobro.nota}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">${cobro.monto.toLocaleString('es-AR')} ARS</p>
                          <span className={`text-[10px] px-1.5 py-0.5 ${cobro.estado === 'cobrado' ? 'bg-green-100 text-green-700' : cobro.estado === 'fallido' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                            {cobro.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelar si activo */}
              {(mantenimiento.estado === 'activo' || mantenimiento.estado === 'pendiente_aprobacion') && (
                <div className="pt-2">
                  {!cancelConfirm ? (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Cancelar servicio de mantenimiento
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 p-4 space-y-3">
                      <p className="text-sm text-red-700 font-medium">¿Confirmás que querés cancelar el servicio de mantenimiento?</p>
                      <p className="text-xs text-red-500">Esta acción no se puede deshacer. Podés volver a solicitar uno después.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCancelConfirm(false)}
                          className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          No, mantener
                        </button>
                        <button
                          onClick={handleCancelar}
                          disabled={cancelando}
                          className="px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {cancelando ? 'Cancelando...' : 'Sí, cancelar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
