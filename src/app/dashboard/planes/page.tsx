'use client'

import { useEffect, useState } from 'react'
import useAuth from '@/hooks/useAuth'
import { useMyProjects } from '@/lib/hooks/useProjects'

interface PlanData {
  _id: string
  nombre: string
  descripcion: string
  precio: number
  tipoPago: string
  mantenimientoPrecio?: number | null
  mantenimientoObligatorio: boolean
  incluye: string[]
}

interface PlanAsignadoData {
  _id: string
  planId: PlanData
  precioAcordado: number
  mantenimientoActivo: boolean
  mantenimientoPrecioAcordado?: number | null
  estadoPago: 'pendiente' | 'pago_parcial' | 'pago_total'
  montoPagado: number
  fechaUltimoPago?: string | null
}

interface PublicPlan {
  _id: string
  nombre: string
  descripcion: string
  precio: number
  mantenimientoPrecio?: number | null
  mantenimientoObligatorio: boolean
  incluye: string[]
  orden: number
}

export default function DashboardPlanesPage() {
  const { token } = useAuth()
  const { projects } = useMyProjects()

  const [planAsignado, setPlanAsignado] = useState<PlanAsignadoData | null | undefined>(undefined)
  const [publicPlanes, setPublicPlanes] = useState<PublicPlan[]>([])
  const [loading, setLoading] = useState(true)

  const projectId = projects?.[0]?._id

  useEffect(() => {
    if (!token || !projectId) {
      // No project yet — load catalog
      fetch('/api/planes')
        .then((r) => r.json())
        .then((d) => setPublicPlanes(d.planes || []))
        .finally(() => setLoading(false))
      return
    }

    fetch(`/api/proyectos/${projectId}/plan`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setPlanAsignado(d.planAsignado ?? null)
        if (!d.planAsignado) {
          return fetch('/api/planes').then((r) => r.json()).then((pd) => setPublicPlanes(pd.planes || []))
        }
      })
      .finally(() => setLoading(false))
  }, [token, projectId])

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

  const porcentajePago = planAsignado
    ? Math.min((planAsignado.montoPagado / planAsignado.precioAcordado) * 100, 100)
    : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ PLANES ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Mi Plan</h1>
        <p className="mt-1 text-sm text-gray-400 font-light">Detalle del servicio contratado y estado de pago.</p>
      </div>

      {/* ── PLAN ASIGNADO ──────────────────────────────────── */}
      {planAsignado && (
        <div className="space-y-4">
          {/* Card principal */}
          <div className="bg-white border border-gray-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block text-[10px] font-medium tracking-widest text-blue-600 uppercase bg-blue-50 px-2 py-0.5 mb-2">
                  Tu plan actual
                </span>
                <h2 className="text-xl font-medium text-gray-900">{planAsignado.planId.nombre}</h2>
                <p className="text-sm text-gray-500 font-light mt-1">{planAsignado.planId.descripcion}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-light text-gray-900">${planAsignado.precioAcordado.toLocaleString('es-AR')}</p>
                <span className="text-[10px] tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 uppercase">Pago único</span>
              </div>
            </div>

            {/* Estado de pago */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-3">Estado de pago</p>

              {planAsignado.estadoPago === 'pago_total' && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 px-4 py-3">
                  <span className="text-green-600 text-lg">✓</span>
                  <div>
                    <p className="text-sm font-medium text-green-700">Pago completo</p>
                    <p className="text-xs text-green-600">${planAsignado.montoPagado.toLocaleString('es-AR')} ARS</p>
                  </div>
                </div>
              )}

              {planAsignado.estadoPago === 'pago_parcial' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-600 font-medium">Pago parcial</span>
                    <span className="text-gray-600">
                      ${planAsignado.montoPagado.toLocaleString('es-AR')} de ${planAsignado.precioAcordado.toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${porcentajePago}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{Math.round(porcentajePago)}% pagado</span>
                    <span>Pendiente: ${Math.max(planAsignado.precioAcordado - planAsignado.montoPagado, 0).toLocaleString('es-AR')} ARS</span>
                  </div>
                </div>
              )}

              {planAsignado.estadoPago === 'pendiente' && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-3">
                  <span className="text-red-500 text-lg">!</span>
                  <div>
                    <p className="text-sm font-medium text-red-600">Pago pendiente</p>
                    <p className="text-xs text-red-500">${planAsignado.precioAcordado.toLocaleString('es-AR')} ARS</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mantenimiento */}
          {planAsignado.mantenimientoActivo && planAsignado.mantenimientoPrecioAcordado != null && (
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">Mantenimiento mensual</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">Activo</p>
                  {planAsignado.planId.mantenimientoObligatorio && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5">Obligatorio</span>
                  )}
                  {!planAsignado.planId.mantenimientoObligatorio && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5">Activo</span>
                  )}
                </div>
                <p className="text-lg font-light text-gray-900">
                  ${planAsignado.mantenimientoPrecioAcordado.toLocaleString('es-AR')}<span className="text-xs text-gray-400">/mes</span>
                </p>
              </div>
            </div>
          )}

          {/* Qué incluye */}
          {planAsignado.planId.incluye.length > 0 && (
            <div className="bg-white border border-gray-200 p-5">
              <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-4">Qué incluye tu plan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {planAsignado.planId.incluye.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-blue-500 mt-0.5 shrink-0">✓</span>
                    <span className="text-sm text-gray-600 font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SIN PLAN ASIGNADO: catálogo ────────────────────── */}
      {planAsignado === null && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-sm text-blue-700">Tu plan todavía no fue asignado. Podés ver el catálogo de servicios disponibles a continuación.</p>
          </div>

          {publicPlanes.length === 0 ? (
            <div className="bg-white border border-gray-200 p-6 text-center text-sm text-gray-400">No hay planes disponibles.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {publicPlanes.map((plan) => (
                <div key={plan._id} className="bg-white border border-gray-200 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-medium text-gray-900">{plan.nombre}</h3>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-light text-gray-900">${plan.precio.toLocaleString('es-AR')}</p>
                      <p className="text-[10px] text-gray-400">Pago único</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-light">{plan.descripcion}</p>
                  {plan.mantenimientoPrecio != null && (
                    <p className="text-xs text-gray-400">
                      Mantenimiento: ${plan.mantenimientoPrecio.toLocaleString('es-AR')}/mes
                      {plan.mantenimientoObligatorio && <span className="ml-1 text-amber-600">(obligatorio)</span>}
                    </p>
                  )}
                  {plan.incluye.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      {plan.incluye.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 text-xs mt-0.5 shrink-0">✓</span>
                          <span className="text-xs text-gray-600">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
