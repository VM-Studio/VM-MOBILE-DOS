'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Client {
  _id: string
  name: string
  company?: string
  email: string
}

interface StageForm {
  name: string
  description: string
  requiresApproval: boolean
}

export default function NuevoProyectoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClient = searchParams.get('clientId') || ''

  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    clientId: preselectedClient,
    name: '',
    type: 'web',
    description: '',
    startDate: '',
    estimatedEndDate: '',
    budget: '',
    previewUrl: '',
  })
  const [stages, setStages] = useState<StageForm[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('vm_token')
    fetch('/api/admin/clients?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
  }, [])

  const addStage = () => setStages((prev) => [...prev, { name: '', description: '', requiresApproval: false }])
  const removeStage = (i: number) => setStages((prev) => prev.filter((_, idx) => idx !== i))
  const updateStage = (i: number, key: keyof StageForm, value: string | boolean) => {
    setStages((prev) => prev.map((s, idx) => idx === i ? { ...s, [key]: value } : s))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId) { setError('Seleccioná un cliente'); return }
    setSaving(true)
    setError('')
    const token = localStorage.getItem('vm_token')
    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        stages: stages.filter((s) => s.name).map((s, i) => ({ ...s, order: i + 1 })),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al crear proyecto'); setSaving(false); return }
    router.replace(`/admin/proyectos/${data.project._id}`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl space-y-6">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ PROYECTOS ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Nuevo proyecto</h1>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-medium text-gray-900">Información general</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cliente *</label>
            <select
              required
              value={form.clientId}
              onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            >
              <option value="">Seleccioná un cliente</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.company ? `${c.company} — ` : ''}{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del proyecto *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="Ej: Rediseño web corporativo"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
              >
                <option value="web">Web</option>
                <option value="app">App</option>
                <option value="landing">Landing</option>
                <option value="ecommerce">E-commerce</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Presupuesto total (ARS) — opcional</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Preview cuotas automáticas */}
          {form.budget && parseFloat(form.budget) > 0 && (() => {
            const b = parseFloat(form.budget)
            const mitad = Math.round(b / 2)
            const mitadResto = b - mitad
            return (
              <div className="border border-blue-100 bg-blue-50 p-4 space-y-3">
                <p className="text-[10px] font-medium tracking-wider text-blue-600 uppercase">Se generarán 2 facturas automáticamente:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white border border-gray-100 p-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700">Cuota 1 — Anticipo 50%</p>
                      {form.startDate && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Vence: {new Date(form.startDate).toLocaleDateString('es-AR')}</p>
                      )}
                    </div>
                    <p className="text-sm font-light text-gray-900">${mitad.toLocaleString('es-AR')} ARS</p>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-gray-100 p-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700">Cuota 2 — Saldo final 50%</p>
                      {form.estimatedEndDate && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Disponible: {new Date(form.estimatedEndDate).toLocaleDateString('es-AR')}</p>
                      )}
                    </div>
                    <p className="text-sm font-light text-gray-900">${mitadResto.toLocaleString('es-AR')} ARS</p>
                  </div>
                </div>
                <p className="text-[10px] text-blue-400">El cálculo final se realiza en el servidor al crear el proyecto.</p>
              </div>
            )
          })()}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors resize-none"
              placeholder="Descripción del proyecto..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de inicio</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fin estimado</label>
              <input
                type="date"
                value={form.estimatedEndDate}
                onChange={(e) => setForm((p) => ({ ...p, estimatedEndDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL de preview (opcional)</label>
            <input
              type="url"
              value={form.previewUrl}
              onChange={(e) => setForm((p) => ({ ...p, previewUrl: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Etapas */}
        <div className="bg-white border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Etapas del proyecto</h2>
            <button type="button" onClick={addStage} className="text-xs text-blue-600 hover:underline">
              + Agregar etapa
            </button>
          </div>

          {!stages.length && (
            <p className="text-sm text-gray-400 font-light">No hay etapas definidas. Podés agregarlas después.</p>
          )}

          {stages.map((s, i) => (
            <div key={i} className="border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Etapa {i + 1}</span>
                <button type="button" onClick={() => removeStage(i)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
              </div>
              <input
                required
                placeholder="Nombre de la etapa"
                value={s.name}
                onChange={(e) => updateStage(i, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
              />
              <input
                placeholder="Descripción (opcional)"
                value={s.description}
                onChange={(e) => updateStage(i, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
              />
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={s.requiresApproval}
                  onChange={(e) => updateStage(i, 'requiresApproval', e.target.checked)}
                  className="rounded"
                />
                Requiere aprobación del cliente
              </label>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-400 text-sm text-gray-700 tracking-wider hover:bg-gray-100 transition-all"
          >
            CANCELAR
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
          >
            {saving ? 'CREANDO PROYECTO...' : 'CREAR PROYECTO'}
          </button>
        </div>
      </form>
    </div>
  )
}
