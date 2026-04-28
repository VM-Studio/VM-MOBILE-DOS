'use client'

import { useEffect, useState } from 'react'

interface Plan {
  _id: string
  nombre: string
  descripcion: string
  precio: number
  tipoPago: string
  mantenimientoPrecio?: number | null
  mantenimientoObligatorio: boolean
  incluye: string[]
  activo: boolean
  orden: number
}

const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  precio: '',
  tipoPago: 'pago_unico',
  mantenimientoPrecio: '',
  mantenimientoObligatorio: false,
  incluye: [] as string[],
  activo: true,
  orden: '',
}

export default function AdminPlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [incluyeInput, setIncluyeInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const token = () => localStorage.getItem('vm_token') || ''

  const fetchPlanes = async () => {
    setLoading(true)
    const res = await fetch('/api/planes?all=true', {
      headers: { Authorization: `Bearer ${token()}` },
    })
    const data = await res.json()
    setPlanes(data.planes || [])
    setLoading(false)
  }

  useEffect(() => { fetchPlanes() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setIncluyeInput('')
    setError('')
    setModalOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingId(plan._id)
    setForm({
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio: String(plan.precio),
      tipoPago: plan.tipoPago,
      mantenimientoPrecio: plan.mantenimientoPrecio != null ? String(plan.mantenimientoPrecio) : '',
      mantenimientoObligatorio: plan.mantenimientoObligatorio,
      incluye: [...plan.incluye],
      activo: plan.activo,
      orden: String(plan.orden),
    })
    setIncluyeInput('')
    setError('')
    setModalOpen(true)
  }

  const addIncluye = () => {
    if (!incluyeInput.trim()) return
    setForm((p) => ({ ...p, incluye: [...p.incluye, incluyeInput.trim()] }))
    setIncluyeInput('')
  }

  const removeIncluye = (i: number) => {
    setForm((p) => ({ ...p, incluye: p.incluye.filter((_, idx) => idx !== i) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.descripcion || !form.precio) {
      setError('Nombre, descripción y precio son requeridos.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: parseFloat(form.precio),
      tipoPago: form.tipoPago,
      mantenimientoPrecio: form.mantenimientoPrecio ? parseFloat(form.mantenimientoPrecio) : null,
      mantenimientoObligatorio: form.mantenimientoObligatorio,
      incluye: form.incluye,
      activo: form.activo,
      orden: form.orden ? parseInt(form.orden) : 0,
    }

    const url = editingId ? `/api/planes/${editingId}` : '/api/planes'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al guardar.')
      setSaving(false)
      return
    }
    setModalOpen(false)
    await fetchPlanes()
    setSaving(false)
  }

  const toggleActivo = async (plan: Plan) => {
    await fetch(`/api/planes/${plan._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ activo: !plan.activo }),
    })
    await fetchPlanes()
  }

  const handleSeed = async () => {
    if (!confirm('¿Cargar los 6 planes iniciales de VM Studio? Solo se ejecuta si no hay planes.')) return
    setSeeding(true)
    setSeedMsg('')
    const res = await fetch('/api/planes/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
    })
    const data = await res.json()
    setSeedMsg(data.message || 'Listo.')
    setSeeding(false)
    await fetchPlanes()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ PLANES ]</span>
          <h1 className="mt-2 text-2xl font-light text-gray-900">Gestión de Planes</h1>
          <p className="mt-1 text-sm text-gray-400 font-light">Administrá los planes y servicios disponibles.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 border border-gray-300 text-sm text-gray-600 tracking-wider hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {seeding ? 'CARGANDO...' : 'CARGAR PLANES INICIALES'}
          </button>
          <button
            onClick={openCreate}
            className="px-5 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            + NUEVO PLAN
          </button>
        </div>
      </div>

      {seedMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
          {seedMsg}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Cargando planes...</div>
      ) : planes.length === 0 ? (
        <div className="bg-white border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-400">No hay planes creados.</p>
          <p className="text-xs text-gray-400 mt-1">Hacé click en &quot;CARGAR PLANES INICIALES&quot; para cargar los 6 planes de VM Studio, o creá uno manualmente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {planes.map((plan) => (
            <div key={plan._id} className={`bg-white border p-5 transition-all ${plan.activo ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-medium tracking-widest text-gray-400">[ {plan.orden} ]</span>
                    <h3 className="text-base font-medium text-gray-900">{plan.nombre}</h3>
                    <span className={`text-[10px] px-2 py-0.5 font-medium tracking-wider uppercase ${plan.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {plan.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-light mt-1">{plan.descripcion}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">${plan.precio.toLocaleString('es-AR')} ARS</span>
                    {plan.mantenimientoPrecio != null && (
                      <span className="text-xs text-gray-400">
                        Mantenimiento: ${plan.mantenimientoPrecio.toLocaleString('es-AR')}/mes
                        {plan.mantenimientoObligatorio && <span className="ml-1 text-amber-600">(obligatorio)</span>}
                      </span>
                    )}
                    <span className="text-xs text-blue-600">{plan.incluye.length} ítems incluidos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(plan)}
                    className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 tracking-wider hover:bg-gray-50 transition-all"
                  >
                    EDITAR
                  </button>
                  <button
                    onClick={() => toggleActivo(plan)}
                    className={`px-3 py-1.5 text-xs border tracking-wider transition-all ${plan.activo ? 'border-red-200 text-red-400 hover:bg-red-50' : 'border-green-200 text-green-500 hover:bg-green-50'}`}
                  >
                    {plan.activo ? 'DESACTIVAR' : 'ACTIVAR'}
                  </button>
                </div>
              </div>

              {/* Lista de incluidos (expandida) */}
              {plan.incluye.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-2">Incluye:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {plan.incluye.map((item, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5 shrink-0">✓</span>
                        <span className="text-xs text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg my-8 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">{editingId ? 'Editar plan' : 'Nuevo plan'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2">{error}</p>}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input required value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400" placeholder="Ej: Web Profesional" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción *</label>
                <textarea required rows={2} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Precio (ARS) *</label>
                  <input required type="number" min="0" value={form.precio} onChange={(e) => setForm((p) => ({ ...p, precio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
                  <input type="number" min="0" value={form.orden} onChange={(e) => setForm((p) => ({ ...p, orden: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Precio mantenimiento/mes</label>
                  <input type="number" min="0" value={form.mantenimientoPrecio} onChange={(e) => setForm((p) => ({ ...p, mantenimientoPrecio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400" placeholder="0" />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs text-gray-600 py-2.5">
                    <input type="checkbox" checked={form.mantenimientoObligatorio} onChange={(e) => setForm((p) => ({ ...p, mantenimientoObligatorio: e.target.checked }))} />
                    Mantenimiento obligatorio
                  </label>
                </div>
              </div>

              {/* Incluye */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Incluye</label>
                <div className="space-y-1 mb-2 max-h-40 overflow-y-auto">
                  {form.incluye.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5">
                      <span className="text-blue-500 text-xs">✓</span>
                      <span className="flex-1 text-xs text-gray-700">{item}</span>
                      <button type="button" onClick={() => removeIncluye(i)} className="text-red-400 hover:text-red-600 text-xs">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={incluyeInput}
                    onChange={(e) => setIncluyeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIncluye() } }}
                    placeholder="Agregar ítem y presionar Enter o +"
                    className="flex-1 px-3 py-2 border border-gray-200 text-xs focus:outline-none focus:border-blue-400"
                  />
                  <button type="button" onClick={addIncluye} className="px-3 py-2 border border-gray-300 text-xs text-gray-600 hover:bg-gray-50">+</button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="activo" checked={form.activo} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} />
                <label htmlFor="activo" className="text-xs text-gray-600">Plan activo (visible para asignar)</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 tracking-wider transition-all">
                  CANCELAR
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-50">
                  {saving ? 'GUARDANDO...' : (editingId ? 'GUARDAR CAMBIOS' : 'CREAR PLAN')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
