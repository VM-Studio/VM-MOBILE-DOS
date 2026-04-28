'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DownloadPDFButton from '@/components/pdf/DownloadPDFButton'
import { useAdminProject } from '@/lib/hooks/useProjects'
import PreviewManager from '@/components/admin/proyectos/PreviewManager'

interface Stage {
  _id: string
  name: string
  status: string
  order: number
  description?: string
  requiresApproval: boolean
}

interface FileItem {
  _id: string
  name: string
  url: string
  category: string
  uploadedAt: string
}

interface Update {
  message: string
  createdAt: string
}

interface ProjectInvoice {
  _id: string
  number: string
  description: string
  amount: number
  status: 'pendiente' | 'verificando' | 'pagado' | 'vencido' | 'rechazado'
  invoiceType?: 'anticipo' | 'saldo_final' | 'manual'
  installment?: number | null
  totalInstallments?: number | null
  paymentEnabled?: boolean
  enabledAt?: string | null
  dueDate?: string
  paidAt?: string
}

const stageStatusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  en_revision: 'En revisión',
  completado: 'Completado',
  rechazado: 'Rechazado',
}
const stageStatusColors: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-600',
  en_progreso: 'bg-blue-50 text-blue-700',
  en_revision: 'bg-amber-50 text-amber-700',
  completado: 'bg-green-50 text-green-700',
  rechazado: 'bg-red-50 text-red-700',
}

export default function AdminProyectoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<'etapas' | 'archivos' | 'updates'>('etapas')

  // Update form
  const [updateMsg, setUpdateMsg] = useState('')
  const [notifyClient, setNotifyClient] = useState(true)
  const [sendingUpdate, setSendingUpdate] = useState(false)

  // File form
  const [fileForm, setFileForm] = useState({ name: '', url: '', category: 'otros' })
  const [addingFile, setAddingFile] = useState(false)

  // Stage form
  const [addStageForm, setAddStageForm] = useState({ name: '', description: '', requiresApproval: false })
  const [addingStage, setAddingStage] = useState(false)

  // Status edit only (progress is auto-calculated from stages)
  const [editStatus, setEditStatus] = useState(false)
  const [statusVal, setStatusVal] = useState('')
  const [deleting, setDeleting] = useState(false)

  const router = useRouter()
  const token = () => localStorage.getItem('vm_token') || ''

  const { project, isLoading: loading, refresh } = useAdminProject(id ?? null)

  // Facturas del proyecto
  const [projectInvoices, setProjectInvoices] = useState<ProjectInvoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  // Plan asignado
  interface PlanData {
    _id: string; nombre: string; descripcion: string; precio: number
    mantenimientoPrecio?: number | null; mantenimientoObligatorio: boolean; incluye: string[]
  }
  interface PlanAsignadoData {
    _id: string; planId: PlanData; precioAcordado: number; mantenimientoActivo: boolean
    mantenimientoPrecioAcordado?: number | null; estadoPago: string
    montoPagado: number; fechaUltimoPago?: string | null; notasPago?: string | null
    historialPagos: { _id: string; monto: number; fecha: string; nota?: string }[]
  }

  // Mantenimiento
  interface CobroHistorial { _id: string; fecha: string; monto: number; estado: string; nota?: string }
  interface MantenimientoData {
    _id: string; tipo: string; estado: string; precioMensual: number
    fechaSolicitud: string; fechaAprobacion?: string | null; fechaInicio?: string | null
    fechaProximoCobro?: string | null; fechaCancelacion?: string | null
    motivoCancelacion?: string | null; notaCliente?: string | null; notaAdmin?: string | null
    cobrosRealizados: number; historialCobros: CobroHistorial[]
  }
  const [planAsignado, setPlanAsignado] = useState<PlanAsignadoData | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  // Edit plan asignado
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  const [planEditForm, setPlanEditForm] = useState({ estadoPago: 'pendiente', montoPagado: '', notasPago: '', fechaUltimoPago: '' })
  const [savingPlan, setSavingPlan] = useState(false)
  // Registrar pago
  const [pagoForm, setPagoForm] = useState({ monto: '', fecha: '', nota: '' })
  const [savingPago, setSavingPago] = useState(false)

  // Mantenimiento
  const [mantenimiento, setMantenimiento] = useState<MantenimientoData | null>(null)
  const [loadingMant, setLoadingMant] = useState(false)
  const [mantAccion, setMantAccion] = useState('')
  const [mantNota, setMantNota] = useState('')
  const [savingMant, setSavingMant] = useState(false)
  const [cobroNota, setCobroNota] = useState('')
  const [savingCobro, setSavingCobro] = useState(false)

  // Firma de cierre
  const [requestingSign, setRequestingSign] = useState(false)
  const [cancelingSign, setCancelingSign] = useState(false)

  const fetchPlan = async () => {
    if (!id) return
    setLoadingPlan(true)
    const t = localStorage.getItem('vm_token') || ''
    const res = await fetch(`/api/proyectos/${id}/plan`, { headers: { Authorization: `Bearer ${t}` } })
    if (res.ok) {
      const data = await res.json()
      setPlanAsignado(data.planAsignado)
      if (data.planAsignado) {
        setPlanEditForm({
          estadoPago: data.planAsignado.estadoPago,
          montoPagado: String(data.planAsignado.montoPagado),
          notasPago: data.planAsignado.notasPago ?? '',
          fechaUltimoPago: data.planAsignado.fechaUltimoPago ? data.planAsignado.fechaUltimoPago.split('T')[0] : '',
        })
      }
    }
    setLoadingPlan(false)
  }

  const handleSavePlanEdit = async () => {
    if (!id) return
    setSavingPlan(true)
    const t = localStorage.getItem('vm_token') || ''
    await fetch(`/api/proyectos/${id}/plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({
        estadoPago: planEditForm.estadoPago,
        montoPagado: planEditForm.montoPagado ? parseFloat(planEditForm.montoPagado) : undefined,
        notasPago: planEditForm.notasPago || null,
        fechaUltimoPago: planEditForm.fechaUltimoPago || null,
      }),
    })
    await fetchPlan()
    setEditPlanOpen(false)
    setSavingPlan(false)
  }

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pagoForm.monto || parseFloat(pagoForm.monto) <= 0) return
    setSavingPago(true)
    const t = localStorage.getItem('vm_token') || ''
    await fetch(`/api/proyectos/${id}/plan/registrar-pago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ monto: parseFloat(pagoForm.monto), fecha: pagoForm.fecha || undefined, nota: pagoForm.nota || undefined }),
    })
    setPagoForm({ monto: '', fecha: '', nota: '' })
    await fetchPlan()
    setSavingPago(false)
  }

  useEffect(() => {
    if (project) setStatusVal(project.status)
  }, [project])

  useEffect(() => {
    if (!id) return
    const t = localStorage.getItem('vm_token') || ''
    setLoadingInvoices(true)
    fetch(`/api/admin/projects/${id}/invoices`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => r.json())
      .then((d) => setProjectInvoices(d.invoices || []))
      .finally(() => setLoadingInvoices(false))
  }, [id])

  useEffect(() => { fetchPlan() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMantenimiento = async () => {
    if (!id) return
    setLoadingMant(true)
    const t = localStorage.getItem('vm_token') || ''
    const res = await fetch(`/api/proyectos/${id}/mantenimiento`, { headers: { Authorization: `Bearer ${t}` } })
    if (res.ok) {
      const data = await res.json()
      setMantenimiento(data.mantenimiento ?? null)
    }
    setLoadingMant(false)
  }

  useEffect(() => { fetchMantenimiento() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMantAccion = async (accion: string) => {
    if (!id) return
    setSavingMant(true)
    const t = localStorage.getItem('vm_token') || ''
    await fetch(`/api/proyectos/${id}/mantenimiento`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ accion, notaAdmin: mantNota || undefined }),
    })
    setMantNota('')
    setMantAccion('')
    await fetchMantenimiento()
    setSavingMant(false)
  }

  const handleRegistrarCobro = async () => {
    if (!id) return
    setSavingCobro(true)
    const t = localStorage.getItem('vm_token') || ''
    await fetch(`/api/proyectos/${id}/mantenimiento/registrar-cobro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ nota: cobroNota || undefined }),
    })
    setCobroNota('')
    await fetchMantenimiento()
    setSavingCobro(false)
  }

  const postAction = async (body: object) => {
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(body),
    })
    if (res.ok) await refresh()
    return res.ok
  }

  const handleSendUpdate = async () => {
    if (!updateMsg.trim()) return
    setSendingUpdate(true)
    await postAction({ action: 'add_update', message: updateMsg, notifyClient })
    setUpdateMsg('')
    setSendingUpdate(false)
  }

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingFile(true)
    await postAction({ action: 'add_file', ...fileForm })
    setFileForm({ name: '', url: '', category: 'otros' })
    setAddingFile(false)
  }

  const handleRemoveFile = async (fileId: string) => {
    if (!confirm('¿Eliminar este archivo?')) return
    await postAction({ action: 'remove_file', fileId })
  }

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addStageForm.name) return
    setAddingStage(true)
    await postAction({ action: 'add_stage', ...addStageForm })
    setAddStageForm({ name: '', description: '', requiresApproval: false })
    setAddingStage(false)
  }

  const handleStageStatus = async (stageId: string, status: string) => {
    await postAction({ action: 'update_stage', stageId, status })
  }

  const handleSaveStatus = async () => {
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ status: statusVal }),
    })
    if (res.ok) { await refresh(); setEditStatus(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Seguro que querés eliminar el proyecto "${project?.name}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    })
    if (res.ok) {
      router.push('/admin/proyectos')
    } else {
      alert('Error al eliminar el proyecto.')
      setDeleting(false)
    }
  }

  const handleRequestSign = async () => {
    if (!confirm('¿Marcar el proyecto como completado y solicitar la firma de cierre al cliente?')) return
    setRequestingSign(true)
    const res = await fetch(`/api/admin/projects/${id}/request-sign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
    })
    if (res.ok) {
      await refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Error al solicitar firma')
    }
    setRequestingSign(false)
  }

  const handleCancelSign = async () => {
    if (!confirm('¿Cancelar la solicitud de firma? El proyecto volverá al estado anterior.')) return
    setCancelingSign(true)
    await fetch(`/api/admin/projects/${id}/request-sign`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    })
    await refresh()
    setCancelingSign(false)
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Cargando...</div>
  if (!project) return <div className="p-8 text-sm text-red-400">Proyecto no encontrado.</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back */}
      <Link href="/admin/proyectos" className="text-sm text-gray-400 hover:text-gray-600">← Proyectos</Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ PROYECTO ]</span>
          <h1 className="mt-2 text-2xl font-light text-gray-900">{project.name}</h1>
          <p className="mt-1 text-sm text-gray-500 font-light">
            <Link href={`/admin/clientes/${project.clientId?._id}`} className="hover:text-blue-600">
              {project.clientId?.company || project.clientId?.name}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {project.previewUrl && (
            <a href={project.previewUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs border border-gray-400 text-gray-700 tracking-wider hover:bg-gray-100 transition-all">
              PREVIEW ↗
            </a>
          )}
          <DownloadPDFButton
            type="project"
            id={id}
            filename={`VM-Proyecto-${project.name}`}
            variant="outline"
            label="PDF"
          />
          <button onClick={() => setEditStatus((v) => !v)} className="px-3 py-1.5 text-xs border border-gray-400 text-gray-700 tracking-wider hover:bg-gray-100 transition-all">
            {editStatus ? 'CANCELAR' : 'EDITAR ESTADO'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Eliminar proyecto"
            className="p-1.5 border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress card */}
      <div className="bg-white border border-gray-200 p-6">
        {editStatus ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado del proyecto</label>
              <select value={statusVal} onChange={(e) => setStatusVal(e.target.value)} className="px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors">
                <option value="en_progreso">En progreso</option>
                <option value="en_revision">En revisión</option>
                <option value="completado">Completado</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
            <button onClick={handleSaveStatus} className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
              GUARDAR
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Estado</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{stageStatusLabels[project.status] || project.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Progreso</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{project.progress}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tipo</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{project.type || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Presupuesto</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{project.budget ? `$${project.budget.toLocaleString('es-AR')}` : '—'}</p>
            </div>
          </div>
        )}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Etapas completadas</span>
            <span>{project.stages.filter((s: Stage) => s.status === 'completado').length} / {project.stages.length}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 w-fit">
        {(['etapas', 'archivos', 'updates'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-sm font-light transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'etapas' ? `Etapas (${project.stages.length})` : t === 'archivos' ? `Archivos (${project.files.length})` : `Updates (${project.updates.length})`}
          </button>
        ))}
      </div>

      {/* ETAPAS */}
      {tab === 'etapas' && (
        <div className="space-y-4">
          {project.stages.length === 0 && <p className="text-sm text-gray-400 font-light">No hay etapas. Agregá la primera abajo.</p>}
          {project.stages.map((s: Stage) => (
            <div key={s._id} className="bg-white border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-400 font-light mt-0.5">{s.description}</p>}
                  {s.requiresApproval && <span className="text-[10px] text-blue-500">Requiere aprobación</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${stageStatusColors[s.status] || 'bg-gray-100 text-gray-600'}`}>
                    {stageStatusLabels[s.status] || s.status}
                  </span>
                  <select
                    value={s.status}
                    onChange={(e) => handleStageStatus(s._id, e.target.value)}
                    className="text-xs border border-gray-200 px-2 py-1 text-gray-700 focus:outline-none focus:border-blue-400 transition-colors"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="en_revision">En revisión</option>
                    <option value="completado">Completado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Add stage */}
          <form onSubmit={handleAddStage} className="bg-gray-50 border border-dashed border-gray-200 p-5 space-y-3">
            <p className="text-xs font-medium text-gray-600">Agregar etapa</p>
            <input required value={addStageForm.name} onChange={(e) => setAddStageForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre de la etapa" className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors" />
            <input value={addStageForm.description} onChange={(e) => setAddStageForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción (opcional)" className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors" />
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={addStageForm.requiresApproval} onChange={(e) => setAddStageForm((p) => ({ ...p, requiresApproval: e.target.checked }))} />
              Requiere aprobación del cliente
            </label>
            <button type="submit" disabled={addingStage} className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50">
              {addingStage ? 'AGREGANDO...' : '+ AGREGAR ETAPA'}
            </button>
          </form>
        </div>
      )}

      {/* ARCHIVOS */}
      {tab === 'archivos' && (
        <div className="space-y-4">
          {project.files.length === 0 && <p className="text-sm text-gray-400 font-light">No hay archivos subidos.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.files.map((f: FileItem) => (
              <div key={f._id} className="bg-white border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{f.name}</a>
                  <p className="text-xs text-gray-400 font-light mt-0.5">{f.category} · {new Date(f.uploadedAt).toLocaleDateString('es-AR')}</p>
                </div>
                <button onClick={() => handleRemoveFile(f._id)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddFile} className="bg-gray-50 border border-dashed border-gray-200 p-5 space-y-3">
            <p className="text-xs font-medium text-gray-600">Agregar archivo / enlace</p>
            <input required value={fileForm.name} onChange={(e) => setFileForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre del archivo" className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors" />
            <input required value={fileForm.url} onChange={(e) => setFileForm((p) => ({ ...p, url: e.target.value }))} placeholder="URL (https://...)" className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors" />
            <select value={fileForm.category} onChange={(e) => setFileForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors">
              <option value="diseño">Diseño</option>
              <option value="credenciales">Credenciales</option>
              <option value="documentos">Documentos</option>
              <option value="links">Links</option>
              <option value="otros">Otros</option>
            </select>
            <button type="submit" disabled={addingFile} className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50">
              {addingFile ? 'AGREGANDO...' : '+ AGREGAR ARCHIVO'}
            </button>
          </form>
        </div>
      )}

      {/* UPDATES */}
      {tab === 'updates' && (
        <div className="space-y-4">
          {/* Send update */}
          <div className="bg-white border border-gray-200 p-5 space-y-3">
            <p className="text-xs font-medium text-gray-600">Nueva actualización</p>
            <textarea
              rows={3}
              value={updateMsg}
              onChange={(e) => setUpdateMsg(e.target.value)}
              placeholder="Escribí una actualización para el cliente..."
              className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={notifyClient} onChange={(e) => setNotifyClient(e.target.checked)} />
                Notificar al cliente (email + notificación)
              </label>
              <button onClick={handleSendUpdate} disabled={sendingUpdate || !updateMsg.trim()} className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50">
                {sendingUpdate ? 'ENVIANDO...' : 'PUBLICAR'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {project.updates.length === 0 && <p className="text-sm text-gray-400 font-light">No hay actualizaciones publicadas.</p>}
            {[...project.updates].reverse().map((u: Update, i: number) => (
              <div key={i} className="bg-white border border-gray-200 p-4">
                <p className="text-sm text-gray-800">{u.message}</p>
                <p className="text-xs text-gray-400 font-light mt-2">{new Date(u.createdAt).toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview en staging */}
      <PreviewManager
        projectId={id as string}
        projectName={project.name}
        initialData={{
          stagingUrl: project.stagingUrl ?? null,
          previewImageUrl: project.previewImageUrl ?? null,
          previewUpdatedAt: project.previewUpdatedAt ?? null,
          lastDeployAt: project.lastDeployAt ?? null,
          lastDeployMessage: project.lastDeployMessage ?? null,
          deployHistory: project.deployHistory ?? [],
        }}
      />

      {/* Sección de facturación del proyecto */}
      <div className="space-y-3">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ FACTURACIÓN DEL PROYECTO ]</span>
        </div>

        {loadingInvoices ? (
          <div className="bg-white border border-gray-200 p-5 text-sm text-gray-400">Cargando facturas...</div>
        ) : !project.budget ? (
          <div className="bg-white border border-gray-200 p-5">
            <p className="text-sm text-gray-400 font-light">
              Este proyecto no tiene presupuesto asignado. Podés crear facturas manualmente desde el panel de facturación.
            </p>
          </div>
        ) : projectInvoices.length === 0 ? (
          <div className="bg-white border border-gray-200 p-5">
            <p className="text-sm text-gray-400 font-light">No se encontraron facturas para este proyecto.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 divide-y divide-gray-100">
            {projectInvoices.map((inv: ProjectInvoice) => {
              const statusColors: Record<string, string> = {
                pagado: 'bg-green-100 text-green-700',
                pendiente: 'bg-yellow-100 text-yellow-700',
                verificando: 'bg-blue-100 text-blue-700',
                vencido: 'bg-red-100 text-red-700',
                rechazado: 'bg-red-100 text-red-700',
              }
              const statusLabels: Record<string, string> = {
                pagado: 'PAGADO ✓',
                pendiente: 'PENDIENTE',
                verificando: 'EN VERIFICACIÓN',
                vencido: 'VENCIDO',
                rechazado: 'RECHAZADO',
              }
              const typeLabel = inv.invoiceType === 'anticipo'
                ? 'Anticipo 50%'
                : inv.invoiceType === 'saldo_final'
                  ? 'Saldo final 50%'
                  : 'Manual'
              const cuotaLabel = inv.installment && inv.totalInstallments
                ? `Cuota ${inv.installment} de ${inv.totalInstallments} — `
                : ''

              return (
                <div key={inv._id} className="flex items-center justify-between p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700">{cuotaLabel}{typeLabel}</p>
                    <p className="text-sm font-light text-gray-900 mt-0.5">${inv.amount?.toLocaleString('es-AR')} ARS</p>
                    {inv.status === 'pagado' && inv.paidAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Pagado el {new Date(inv.paidAt).toLocaleDateString('es-AR')}
                      </p>
                    )}
                    {inv.status !== 'pagado' && inv.paymentEnabled === false && inv.enabledAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        🔒 Disponible el {new Date(inv.enabledAt).toLocaleDateString('es-AR')}
                      </p>
                    )}
                    {inv.status !== 'pagado' && inv.paymentEnabled !== false && inv.dueDate && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Vence: {new Date(inv.dueDate).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase shrink-0 ml-4 ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[inv.status] || inv.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── PLAN Y FACTURACIÓN ─────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ PLAN Y FACTURACIÓN ]</span>
          {planAsignado && !editPlanOpen && (
            <button onClick={() => setEditPlanOpen(true)} className="text-xs text-blue-600 hover:underline">Editar estado</button>
          )}
          {planAsignado && editPlanOpen && (
            <button onClick={() => setEditPlanOpen(false)} className="text-xs text-gray-400 hover:underline">Cancelar</button>
          )}
        </div>

        {loadingPlan ? (
          <div className="bg-white border border-gray-200 p-5 text-sm text-gray-400">Cargando plan...</div>
        ) : !planAsignado ? (
          <div className="bg-white border border-gray-200 p-5">
            <p className="text-sm text-gray-400 font-light">No hay plan asignado a este proyecto.</p>
            <p className="text-xs text-gray-400 mt-1">
              Podés asignarlo al crear el proyecto o desde{' '}
              <a href="/admin/planes" className="text-blue-500 hover:underline">Gestión de Planes</a>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Card del plan */}
            <div className="bg-white border border-gray-200 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-medium tracking-wider text-blue-600 uppercase">Plan contratado</p>
                  <h3 className="text-base font-medium text-gray-900 mt-0.5">{planAsignado.planId.nombre}</h3>
                  <p className="text-sm text-gray-500 font-light mt-0.5">{planAsignado.planId.descripcion}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-light text-gray-900">${planAsignado.precioAcordado.toLocaleString('es-AR')}</p>
                  <p className="text-[10px] text-gray-400">Pago único</p>
                </div>
              </div>

              {/* Estado de pago */}
              <div className="border-t border-gray-100 pt-3">
                {planAsignado.estadoPago === 'pago_total' && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm font-medium">✓ Pago completo</span>
                    <span className="text-sm text-gray-500">${planAsignado.montoPagado.toLocaleString('es-AR')} ARS</span>
                  </div>
                )}
                {planAsignado.estadoPago === 'pago_parcial' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Pago parcial</span>
                      <span>${planAsignado.montoPagado.toLocaleString('es-AR')} de ${planAsignado.precioAcordado.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${Math.min((planAsignado.montoPagado / planAsignado.precioAcordado) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">Pendiente: ${Math.max(planAsignado.precioAcordado - planAsignado.montoPagado, 0).toLocaleString('es-AR')} ARS</p>
                  </div>
                )}
                {planAsignado.estadoPago === 'pendiente' && (
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 text-sm font-medium">Pago pendiente</span>
                    <span className="text-sm text-gray-500">${planAsignado.precioAcordado.toLocaleString('es-AR')} ARS</span>
                  </div>
                )}
              </div>

              {/* Mantenimiento */}
              {planAsignado.mantenimientoActivo && (
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-700">Mantenimiento mensual activo</p>
                    {planAsignado.planId.mantenimientoObligatorio && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5">Obligatorio</span>
                    )}
                  </div>
                  {planAsignado.mantenimientoPrecioAcordado != null && (
                    <p className="text-sm font-medium text-gray-900">${planAsignado.mantenimientoPrecioAcordado.toLocaleString('es-AR')}/mes</p>
                  )}
                </div>
              )}

              {/* Notas internas */}
              {planAsignado.notasPago && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-1">Notas internas</p>
                  <p className="text-xs text-gray-600">{planAsignado.notasPago}</p>
                </div>
              )}
            </div>

            {/* Editar estado de pago */}
            {editPlanOpen && (
              <div className="bg-gray-50 border border-gray-200 p-5 space-y-3">
                <p className="text-xs font-medium text-gray-600">Editar estado de pago</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Estado</label>
                    <select
                      value={planEditForm.estadoPago}
                      onChange={(e) => setPlanEditForm((p) => ({ ...p, estadoPago: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="pago_parcial">Pago parcial</option>
                      <option value="pago_total">Pago total</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Monto pagado (ARS)</label>
                    <input
                      type="number" min="0"
                      value={planEditForm.montoPagado}
                      onChange={(e) => setPlanEditForm((p) => ({ ...p, montoPagado: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Último pago</label>
                    <input
                      type="date"
                      value={planEditForm.fechaUltimoPago}
                      onChange={(e) => setPlanEditForm((p) => ({ ...p, fechaUltimoPago: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Notas internas</label>
                    <input
                      type="text"
                      value={planEditForm.notasPago}
                      onChange={(e) => setPlanEditForm((p) => ({ ...p, notasPago: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                      placeholder="Notas..."
                    />
                  </div>
                </div>
                <button
                  onClick={handleSavePlanEdit}
                  disabled={savingPlan}
                  className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {savingPlan ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </button>
              </div>
            )}

            {/* Registrar nuevo pago */}
            <div className="bg-white border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-700 mb-3">Registrar nuevo pago</p>
              <form onSubmit={handleRegistrarPago} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Monto (ARS) *</label>
                  <input
                    required type="number" min="1"
                    value={pagoForm.monto}
                    onChange={(e) => setPagoForm((p) => ({ ...p, monto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={pagoForm.fecha}
                    onChange={(e) => setPagoForm((p) => ({ ...p, fecha: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nota</label>
                  <input
                    type="text"
                    value={pagoForm.nota}
                    onChange={(e) => setPagoForm((p) => ({ ...p, nota: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="Ej: Transferencia bancaria"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={savingPago}
                    className="px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {savingPago ? 'REGISTRANDO...' : '+ REGISTRAR PAGO'}
                  </button>
                </div>
              </form>

              {/* Historial de pagos */}
              {planAsignado.historialPagos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-2">Historial de pagos</p>
                  <div className="space-y-1.5">
                    {[...planAsignado.historialPagos].reverse().map((pago) => (
                      <div key={pago._id} className="flex items-center justify-between text-xs text-gray-600">
                        <span>${pago.monto.toLocaleString('es-AR')} ARS {pago.nota && `— ${pago.nota}`}</span>
                        <span className="text-gray-400">{new Date(pago.fecha).toLocaleDateString('es-AR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lista de incluidos del plan */}
            {planAsignado.planId.incluye.length > 0 && (
              <div className="bg-white border border-gray-200 p-5">
                <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-3">Qué incluye el plan</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {planAsignado.planId.incluye.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 text-xs mt-0.5 shrink-0">✓</span>
                      <span className="text-xs text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* [ MANTENIMIENTO ] */}
      <div className="space-y-4">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ MANTENIMIENTO ]</span>
        </div>

        {loadingMant ? (
          <div className="bg-white border border-gray-200 p-6 text-sm text-gray-400">Cargando...</div>
        ) : !mantenimiento ? (
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-sm text-gray-400 font-light">
              {project.status !== 'completado'
                ? 'El proyecto aún no está completado. El cliente podrá solicitar mantenimiento una vez que finalice.'
                : 'No hay solicitud de mantenimiento activa para este proyecto.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Card estado */}
            <div className="bg-white border border-gray-200 p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] tracking-wider text-gray-400 uppercase">Estado</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 font-medium ${
                    mantenimiento.estado === 'activo' ? 'bg-green-100 text-green-700' :
                    mantenimiento.estado === 'pendiente_aprobacion' ? 'bg-amber-100 text-amber-700' :
                    mantenimiento.estado === 'pausado' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {mantenimiento.estado === 'pendiente_aprobacion' ? 'Pendiente' :
                     mantenimiento.estado === 'activo' ? 'Activo' :
                     mantenimiento.estado === 'pausado' ? 'Pausado' : 'Cancelado'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-gray-400 uppercase">Tipo</p>
                  <p className="text-sm text-gray-700 mt-1">{mantenimiento.tipo === 'mensual_recurrente' ? 'Mensual recurrente' : 'Puntual'}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-gray-400 uppercase">Precio/mes</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">${mantenimiento.precioMensual.toLocaleString('es-AR')} ARS</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-gray-400 uppercase">Cobros</p>
                  <p className="text-sm text-gray-700 mt-1">{mantenimiento.cobrosRealizados}</p>
                </div>
              </div>

              {mantenimiento.estado === 'activo' && mantenimiento.fechaProximoCobro && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2.5">
                  <span className="text-blue-500 text-sm">📅</span>
                  <p className="text-sm text-blue-700">Próximo cobro: <strong>{new Date(mantenimiento.fechaProximoCobro).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
                </div>
              )}

              {mantenimiento.notaCliente && (
                <div className="bg-gray-50 border border-gray-100 px-4 py-3">
                  <p className="text-[10px] tracking-wider text-gray-400 uppercase mb-1">Nota del cliente</p>
                  <p className="text-sm text-gray-600 font-light">{mantenimiento.notaCliente}</p>
                </div>
              )}

              {/* Acciones admin */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">Acciones</p>
                <div className="flex flex-wrap gap-2">
                  {mantenimiento.estado === 'pendiente_aprobacion' && (
                    <button
                      onClick={() => setMantAccion(mantAccion === 'aprobar' ? '' : 'aprobar')}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Aprobar solicitud
                    </button>
                  )}
                  {mantenimiento.estado === 'activo' && (
                    <>
                      <button
                        onClick={() => setMantAccion(mantAccion === 'registrar_cobro' ? '' : 'registrar_cobro')}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        + Registrar cobro
                      </button>
                      <button
                        onClick={() => setMantAccion(mantAccion === 'pausar' ? '' : 'pausar')}
                        className="px-3 py-1.5 text-xs border border-amber-400 text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        Pausar
                      </button>
                    </>
                  )}
                  {mantenimiento.estado === 'pausado' && (
                    <button
                      onClick={() => setMantAccion(mantAccion === 'reanudar' ? '' : 'reanudar')}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Reanudar
                    </button>
                  )}
                  {(mantenimiento.estado === 'activo' || mantenimiento.estado === 'pausado' || mantenimiento.estado === 'pendiente_aprobacion') && (
                    <button
                      onClick={() => setMantAccion(mantAccion === 'cancelar' ? '' : 'cancelar')}
                      className="px-3 py-1.5 text-xs border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Cancelar servicio
                    </button>
                  )}
                </div>

                {/* Panel registrar cobro */}
                {mantAccion === 'registrar_cobro' && (
                  <div className="flex items-end gap-3 border border-blue-100 bg-blue-50 p-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Nota del cobro (opcional)</label>
                      <input
                        type="text"
                        value={cobroNota}
                        onChange={(e) => setCobroNota(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 bg-white"
                        placeholder="Ej: Transferencia bancaria"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setMantAccion('')} className="px-3 py-2 border border-gray-300 text-xs text-gray-600 hover:bg-gray-50">
                        Cancelar
                      </button>
                      <button
                        onClick={handleRegistrarCobro}
                        disabled={savingCobro}
                        className="px-3 py-2 bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingCobro ? 'Registrando...' : `Confirmar $${mantenimiento.precioMensual.toLocaleString('es-AR')}`}
                      </button>
                    </div>
                  </div>
                )}

                {/* Panel aprobar / pausar / reanudar / cancelar */}
                {['aprobar', 'pausar', 'reanudar', 'cancelar'].includes(mantAccion) && (
                  <div className={`border p-4 space-y-3 ${mantAccion === 'cancelar' ? 'border-red-200 bg-red-50' : 'border-green-100 bg-green-50'}`}>
                    <p className="text-sm font-medium text-gray-700">
                      {mantAccion === 'aprobar' && '¿Aprobar la solicitud de mantenimiento?'}
                      {mantAccion === 'pausar' && '¿Pausar el servicio de mantenimiento?'}
                      {mantAccion === 'reanudar' && '¿Reanudar el servicio de mantenimiento?'}
                      {mantAccion === 'cancelar' && '¿Cancelar definitivamente el servicio?'}
                    </p>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nota interna (opcional)</label>
                      <input
                        type="text"
                        value={mantNota}
                        onChange={(e) => setMantNota(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 bg-white"
                        placeholder="Motivo o nota..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setMantAccion('')} className="px-3 py-2 border border-gray-300 text-xs text-gray-600 hover:bg-gray-50">
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleMantAccion(mantAccion)}
                        disabled={savingMant}
                        className={`px-4 py-2 text-xs text-white font-medium disabled:opacity-50 ${mantAccion === 'cancelar' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {savingMant ? 'Guardando...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de cobros */}
            {mantenimiento.historialCobros.length > 0 && (
              <div className="bg-white border border-gray-200 p-5 space-y-3">
                <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">Historial de cobros</p>
                <div className="space-y-2">
                  {[...mantenimiento.historialCobros].reverse().map((cobro, i) => (
                    <div key={i} className="flex items-center justify-between text-xs border-b border-gray-100 pb-1.5 last:border-0">
                      <div>
                        <span className="text-gray-700">{new Date(cobro.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        {cobro.nota && <span className="text-gray-400 ml-2">— {cobro.nota}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">${cobro.monto.toLocaleString('es-AR')} ARS</span>
                        <span className={`px-1.5 py-0.5 ${cobro.estado === 'cobrado' ? 'bg-green-100 text-green-700' : cobro.estado === 'fallido' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {cobro.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FIRMA DE CIERRE ────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 p-6 space-y-4">
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ FIRMA DE CIERRE ]</span>

        {project.closingSignature?.signedAt ? (
          /* Ya firmado */
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 px-4 py-3">
              <span className="text-green-600 text-lg">✓</span>
              <div>
                <p className="text-sm font-medium text-green-800">Documento firmado</p>
                <p className="text-xs text-green-600">
                  {new Date(project.closingSignature.signedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            {project.closingSignature.certificateUrl && (
              <a
                href={project.closingSignature.certificateUrl}
                download={`Cierre-${project.name}.pdf`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-blue-400 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                DESCARGAR PDF DE CIERRE
              </a>
            )}
          </div>
        ) : project.awaitingSignature ? (
          /* Pendiente de firma del cliente */
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-3">
              <span className="text-amber-600 text-lg">⏳</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Esperando firma del cliente</p>
                <p className="text-xs text-amber-600">El cliente fue notificado para firmar el documento de cierre.</p>
              </div>
            </div>
            <button
              onClick={handleCancelSign}
              disabled={cancelingSign}
              className="px-4 py-2 text-xs border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelingSign ? 'Cancelando...' : 'Cancelar solicitud de firma'}
            </button>
          </div>
        ) : (
          /* Sin firma solicitada */
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-light">
              Cuando el proyecto esté listo, podés solicitar la firma del documento de cierre al cliente.
              Esto marcará el proyecto como <strong>completado</strong> y enviará una notificación al cliente.
            </p>
            <button
              onClick={handleRequestSign}
              disabled={requestingSign}
              className="px-5 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-xs font-medium tracking-wider hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {requestingSign ? 'PROCESANDO...' : 'SOLICITAR FIRMA DE CIERRE'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
