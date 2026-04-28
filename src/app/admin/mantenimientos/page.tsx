'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface MantenimientoItem {
  _id: string
  tipo: string
  estado: string
  precioMensual: number
  fechaSolicitud: string
  fechaProximoCobro?: string | null
  cobrosRealizados: number
  notaCliente?: string | null
  proyectoId: { _id: string; name: string; status: string }
  clienteId: { _id: string; name: string; email: string; company?: string }
}

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  pendiente_aprobacion: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  activo: { label: 'Activo', cls: 'bg-green-100 text-green-700' },
  pausado: { label: 'Pausado', cls: 'bg-gray-100 text-gray-600' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-600' },
}

export default function AdminMantenimientosPage() {
  const [mantenimientos, setMantenimientos] = useState<MantenimientoItem[]>([])
  const [proximosCobros, setProximosCobros] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('') // '' = activo+pendiente, 'all', 'cancelado'...

  const fetchData = async (estado = '') => {
    const t = localStorage.getItem('vm_token') || ''
    const params = estado ? `?estado=${estado}` : ''
    const res = await fetch(`/api/admin/mantenimientos${params}`, {
      headers: { Authorization: `Bearer ${t}` },
    })
    if (res.ok) {
      const data = await res.json()
      setMantenimientos(data.mantenimientos || [])
      setProximosCobros(data.proximosCobros || 0)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData(filtro) }, [filtro])

  const totalActivos = mantenimientos.filter((m) => m.estado === 'activo').length
  const totalPendientes = mantenimientos.filter((m) => m.estado === 'pendiente_aprobacion').length
  const ingresoMensual = mantenimientos
    .filter((m) => m.estado === 'activo')
    .reduce((acc, m) => acc + m.precioMensual, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ MANTENIMIENTO ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Mantenimientos</h1>
        <p className="mt-1 text-sm text-gray-400 font-light">Gestión de servicios de mantenimiento de todos los proyectos.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-[10px] tracking-wider text-gray-400 uppercase">Activos</p>
          <p className="text-2xl font-light text-green-600 mt-1">{totalActivos}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-[10px] tracking-wider text-gray-400 uppercase">Pendientes</p>
          <p className="text-2xl font-light text-amber-500 mt-1">{totalPendientes}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-[10px] tracking-wider text-gray-400 uppercase">Cobros próximos (7d)</p>
          <p className="text-2xl font-light text-blue-600 mt-1">{proximosCobros}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-[10px] tracking-wider text-gray-400 uppercase">Ingreso mensual</p>
          <p className="text-lg font-light text-gray-900 mt-1">${ingresoMensual.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Activos + Pendientes' },
          { value: 'activo', label: 'Activos' },
          { value: 'pendiente_aprobacion', label: 'Pendientes' },
          { value: 'pausado', label: 'Pausados' },
          { value: 'cancelado', label: 'Cancelados' },
          { value: 'all', label: 'Todos' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 text-xs border transition-colors ${filtro === f.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : mantenimientos.length === 0 ? (
        <div className="bg-white border border-gray-200 p-8 text-center text-sm text-gray-400">
          No hay mantenimientos con este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {mantenimientos.map((m) => (
            <div key={m._id} className="bg-white border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 font-medium ${ESTADO_CONFIG[m.estado]?.cls || ''}`}>
                      {ESTADO_CONFIG[m.estado]?.label || m.estado}
                    </span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5">
                      {m.tipo === 'mensual_recurrente' ? 'Mensual recurrente' : 'Puntual'}
                    </span>
                  </div>
                  <Link href={`/admin/proyectos/${m.proyectoId._id}`} className="text-base font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    {m.proyectoId.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {m.clienteId.company ? `${m.clienteId.company} — ` : ''}{m.clienteId.name}
                    <span className="text-gray-400 ml-2">{m.clienteId.email}</span>
                  </p>
                  {m.notaCliente && (
                    <p className="text-xs text-gray-400 italic">&quot;{m.notaCliente}&quot;</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="text-lg font-light text-gray-900">${m.precioMensual.toLocaleString('es-AR')} <span className="text-xs text-gray-400">ARS/mes</span></p>
                  <p className="text-[10px] text-gray-400">{m.cobrosRealizados} cobro{m.cobrosRealizados !== 1 ? 's' : ''} realizado{m.cobrosRealizados !== 1 ? 's' : ''}</p>
                  {m.estado === 'activo' && m.fechaProximoCobro && (
                    <p className="text-[10px] text-blue-500">
                      Próx. cobro: {new Date(m.fechaProximoCobro).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                  {m.estado === 'pendiente_aprobacion' && (
                    <p className="text-[10px] text-amber-500">
                      Solicitud: {new Date(m.fechaSolicitud).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                <Link
                  href={`/admin/proyectos/${m.proyectoId._id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Ver proyecto y gestionar →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
