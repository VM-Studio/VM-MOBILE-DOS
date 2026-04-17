'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface QuoteHistory { status: string; changedAt: string; note?: string }
interface QuoteFormData {
  servicios?: string[]
  // web
  webTipo?: string
  webPaginas?: string
  webContacto?: string[]
  webExtras?: string[]
  // app
  appTipo?: string
  appRubro?: string
  appExtras?: string[]
  // general
  etapaNegocio?: string
  tieneWeb?: boolean
  urlWebActual?: string
  cuandoEmpezar?: string
  comoNosConocio?: string
  // contact
  preferenciaContacto?: string
}
interface Quote {
  _id: string
  name: string
  email: string
  company?: string
  phone?: string
  service: string
  businessType?: string
  budget?: string
  message?: string
  status: string
  notes?: string
  statusHistory?: QuoteHistory[]
  convertedToProject?: { _id: string; name: string }
  wantsWhatsapp?: boolean
  createdAt: string
  formData?: QuoteFormData
}

const statusLabels: Record<string, string> = {
  nueva: 'Nueva', contactado: 'Contactado', propuesta_enviada: 'Propuesta enviada', ganada: 'Ganada', perdida: 'Perdida',
}
const statusColors: Record<string, string> = {
  nueva: 'bg-blue-50 text-blue-700', contactado: 'bg-purple-50 text-purple-700',
  propuesta_enviada: 'bg-amber-50 text-amber-700', ganada: 'bg-green-50 text-green-700', perdida: 'bg-red-50 text-red-700',
}
const serviceLabels: Record<string, string> = {
  web: 'Web', app: 'App', otro: 'Otro',
}

// ── Label maps for formData ──────────────────────────────────────────────────
const SERVICIOS_LABELS: Record<string, string> = {
  web: '🌐 Desarrollo Web', app: '📱 Aplicación',
}
const WEB_TIPO_LABELS: Record<string, string> = {
  informativa: 'Web informativa / institucional',
  catalogo: 'Catálogo de productos (sin venta online)',
  ecommerce: 'Tienda online / E-commerce',
  reservas: 'Web con sistema de reservas / turnos',
  landing: 'Landing page (página de venta única)',
}
const WEB_PAGINAS_LABELS: Record<string, string> = {
  '1-3': '1 a 3 páginas', '4-7': '4 a 7 páginas', '8+': '8 o más páginas',
}
const WEB_CONTACTO_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp', formulario: 'Formulario de contacto',
}
const WEB_EXTRAS_LABELS: Record<string, string> = {
  blog: 'Blog / Noticias', reservas: 'Reservas / Turnos online', carrito: 'Carrito de compras',
  catalogo: 'Catálogo de productos', pasarela_pagos: 'Pasarela de pagos (MercadoPago)',
  login: 'Sistema de login', panel_admin: 'Panel de administración', seo: 'SEO avanzado',
  multiidioma: 'Múltiples idiomas', redes_sociales: 'Integración redes sociales',
  analytics: 'Google Analytics + píxel', chat: 'Chat en vivo',
}
const APP_TIPO_LABELS: Record<string, string> = {
  web: 'Aplicación Web (PWA)', mobile: 'Aplicación Móvil Nativa',
}
const APP_RUBRO_LABELS: Record<string, string> = {
  comercio: 'Comercio / Ventas', gastronomia: 'Restaurante / Gastronomía',
  servicios: 'Servicios profesionales', salud: 'Salud / Bienestar',
  educacion: 'Educación', entretenimiento: 'Entretenimiento', otro: 'Otro',
}
const APP_EXTRAS_LABELS: Record<string, string> = {
  usuarios: 'Sistema de usuarios y perfiles', push: 'Notificaciones push',
  chat: 'Chat en tiempo real', pagos: 'Pagos dentro de la app',
  geo: 'Geolocalización / Mapas', dashboard: 'Dashboard con estadísticas',
  api: 'Integración con sistema externo', panel_admin: 'Panel de administración',
  reservas: 'Sistema de reservas / turnos', ecommerce: 'Tienda / E-commerce',
  multiidioma: 'Soporte multiidioma', offline: 'Modo sin conexión (offline)',
}
const ETAPA_LABELS: Record<string, string> = {
  nuevo: 'Estoy empezando (nuevo negocio)',
  sin_presencia: 'Tengo negocio pero sin presencia online',
  mejorar: 'Tengo presencia online pero quiero mejorarla',
  escalar: 'Ya tengo todo, quiero escalar',
}
const CUANDO_LABELS: Record<string, string> = {
  ahora: 'Lo antes posible', '1mes': 'En el próximo mes',
  '2-3meses': 'En 2 o 3 meses', investigando: 'Solo estoy investigando precios',
}
const CONOCIO_LABELS: Record<string, string> = {
  google: 'Google', instagram: 'Instagram', facebook: 'Facebook',
  recomendacion: 'Recomendación', otro: 'Otro',
}

function TagList({ items, map }: { items: string[]; map: Record<string, string> }) {
  if (!items || items.length === 0) return <span className="text-sm text-gray-400">—</span>
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map((k) => (
        <span key={k} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100">
          {map[k] ?? k}
        </span>
      ))}
    </div>
  )
}
function FRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function AdminCotizacionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [notes, setNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [convertForm, setConvertForm] = useState({ projectName: '', projectType: 'web' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const token = () => localStorage.getItem('vm_token') || ''

  const fetchQuote = async () => {
    const res = await fetch(`/api/admin/quotes/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
    const d = await res.json()
    setQuote(d.quote || null)
    setNotes(d.quote?.notes || '')
    setLoading(false)
  }

  useEffect(() => { fetchQuote() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === quote?.status) return
    setSaving(true); setError('')
    const res = await fetch(`/api/admin/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ status: newStatus, statusNote }),
    })
    const d = await res.json()
    if (!res.ok) { setError(d.error || 'Error'); setSaving(false); return }
    setQuote(d.quote); setStatusNote(''); setNewStatus(''); setSaving(false)
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    const res = await fetch(`/api/admin/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ notes }),
    })
    const d = await res.json()
    if (res.ok) { setQuote(d.quote); setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000) }
    setSaving(false)
  }

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    const res = await fetch(`/api/admin/quotes/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ action: 'convert', ...convertForm }),
    })
    const d = await res.json()
    if (!res.ok) { setError(d.error || 'Error'); setSaving(false); return }
    setShowConvert(false); setSaving(false)
    fetchQuote()
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta cotización?')) return
    await fetch(`/api/admin/quotes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
    router.push('/admin/cotizaciones')
  }

  if (loading) return (
    <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse" />)}</div>
  )
  if (!quote) return <div className="p-8 text-center text-sm text-gray-400">Cotización no encontrada.</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/cotizaciones" className="text-xs text-gray-400 hover:text-blue-600">← Cotizaciones</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ COTIZACIÓN ]</span>
          </div>
          <h1 className="text-2xl font-light text-gray-900">{quote.name}</h1>
          <p className="text-sm text-gray-400 mt-1 font-light">{quote.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-medium px-2 py-1 tracking-wider uppercase ${statusColors[quote.status]}`}>{statusLabels[quote.status]}</span>
          {!quote.convertedToProject && quote.status !== 'ganada' && quote.status !== 'perdida' && (
            <button onClick={() => setShowConvert(true)} className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-medium tracking-wider hover:shadow-lg transition-all">
              CONVERTIR A PROYECTO
            </button>
          )}
          <button onClick={handleDelete} className="px-3 py-1.5 border border-red-200 text-xs text-red-500 hover:bg-red-50 tracking-wider">ELIMINAR</button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {quote.convertedToProject && (
        <div className="bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-green-700">Convertida al proyecto: <Link href={`/admin/proyectos/${quote.convertedToProject._id}`} className="font-medium underline">{quote.convertedToProject.name}</Link></span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Información del contacto</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Nombre', value: quote.name },
                { label: 'Email', value: quote.email },
                { label: 'Empresa', value: quote.company || '—' },
                { label: 'Teléfono', value: quote.phone || '—' },
                { label: 'Servicio', value: serviceLabels[quote.service] || quote.service },
                { label: 'Presupuesto', value: quote.budget || '—' },
                { label: 'Rubro', value: quote.businessType || '—' },
                { label: 'Fecha', value: new Date(quote.createdAt).toLocaleDateString('es-AR') },
                { label: 'Quiere WhatsApp', value: quote.wantsWhatsapp ? 'Sí' : 'No' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {quote.message && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Mensaje</p>
                <p className="text-sm text-gray-700 font-light">{quote.message}</p>
              </div>
            )}
          </div>

          {/* ── Detalle del formulario ── */}
          {quote.formData && (
            <div className="bg-white border border-gray-200 p-6 space-y-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle del formulario</p>

              {/* Servicios seleccionados */}
              {quote.formData.servicios && quote.formData.servicios.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Servicios solicitados</p>
                  <TagList items={quote.formData.servicios} map={SERVICIOS_LABELS} />
                </div>
              )}

              {/* WEB */}
              {quote.formData.servicios?.includes('web') && (
                <div className="border-t border-gray-50 pt-5 space-y-4">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">🌐 Desarrollo Web</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FRow label="Tipo de web" value={WEB_TIPO_LABELS[quote.formData.webTipo ?? ''] ?? quote.formData.webTipo} />
                    <FRow label="Cantidad de páginas" value={WEB_PAGINAS_LABELS[quote.formData.webPaginas ?? ''] ?? quote.formData.webPaginas} />
                  </div>
                  {quote.formData.webContacto && quote.formData.webContacto.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Formas de contacto</p>
                      <TagList items={quote.formData.webContacto} map={WEB_CONTACTO_LABELS} />
                    </div>
                  )}
                  {quote.formData.webExtras && quote.formData.webExtras.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Funcionalidades adicionales</p>
                      <TagList items={quote.formData.webExtras} map={WEB_EXTRAS_LABELS} />
                    </div>
                  )}
                </div>
              )}

              {/* APP */}
              {quote.formData.servicios?.includes('app') && (
                <div className="border-t border-gray-50 pt-5 space-y-4">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">📱 Aplicación</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FRow label="Tipo de app" value={APP_TIPO_LABELS[quote.formData.appTipo ?? ''] ?? quote.formData.appTipo} />
                    <FRow label="Rubro / Industria" value={APP_RUBRO_LABELS[quote.formData.appRubro ?? ''] ?? quote.formData.appRubro} />
                  </div>
                  {quote.formData.appExtras && quote.formData.appExtras.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Funcionalidades adicionales</p>
                      <TagList items={quote.formData.appExtras} map={APP_EXTRAS_LABELS} />
                    </div>
                  )}
                </div>
              )}

              {/* GENERAL */}
              <div className="border-t border-gray-50 pt-5 space-y-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">📋 Información general</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FRow label="Etapa del negocio" value={ETAPA_LABELS[quote.formData.etapaNegocio ?? ''] ?? quote.formData.etapaNegocio} />
                  <FRow label="¿Tiene sitio web actual?" value={quote.formData.tieneWeb === true ? 'Sí' : quote.formData.tieneWeb === false ? 'No' : undefined} />
                  {quote.formData.tieneWeb && quote.formData.urlWebActual && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">URL del sitio actual</p>
                      <a href={quote.formData.urlWebActual} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-0.5 block break-all">{quote.formData.urlWebActual}</a>
                    </div>
                  )}
                  <FRow label="¿Cuándo quiere empezar?" value={CUANDO_LABELS[quote.formData.cuandoEmpezar ?? ''] ?? quote.formData.cuandoEmpezar} />
                  <FRow label="¿Cómo nos conoció?" value={CONOCIO_LABELS[quote.formData.comoNosConocio ?? ''] ?? quote.formData.comoNosConocio} />
                  <FRow label="Preferencia de contacto" value={quote.formData.preferenciaContacto} />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Notas internas</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Agregar notas sobre esta cotización..."
              className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors resize-none"
            />
            <button onClick={handleSaveNotes} disabled={saving} className="mt-2 px-4 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-xs font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-50">
              {notesSaved ? '✓ GUARDADO' : 'GUARDAR NOTAS'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Change status */}
          <div className="bg-white border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Cambiar estado</p>
            <select value={newStatus || quote.status} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors mb-2">
              {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} placeholder="Nota del cambio (opcional)" className="w-full px-3 py-2 border border-gray-200 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors resize-none mb-2" />
            <button onClick={handleStatusChange} disabled={saving || !newStatus || newStatus === quote.status} className="w-full px-3 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-xs font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-40">
              ACTUALIZAR ESTADO
            </button>
          </div>

          {/* Status history */}
          {quote.statusHistory && quote.statusHistory.length > 0 && (
          <div className="bg-white border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Historial</p>
              <div className="space-y-3">
                {[...quote.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{statusLabels[h.status] || h.status}</p>
                      {h.note && <p className="text-[11px] text-gray-400 mt-0.5">{h.note}</p>}
                      <p className="text-[10px] text-gray-300 mt-0.5">{new Date(h.changedAt).toLocaleDateString('es-AR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Convert modal */}
      {showConvert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-light text-gray-900 mb-1">Convertir a proyecto</h2>
            <p className="text-xs text-gray-400 mb-4 font-light">Se creará un cliente y un proyecto con los datos de la cotización.</p>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <form onSubmit={handleConvert} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del proyecto *</label>
                <input required value={convertForm.projectName} onChange={(e) => setConvertForm((p) => ({ ...p, projectName: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors" placeholder="Ej: Sitio web para Empresa X" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de proyecto</label>
                <select value={convertForm.projectType} onChange={(e) => setConvertForm((p) => ({ ...p, projectType: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors">
                  <option value="web">Web</option>
                  <option value="app">App</option>
                  <option value="marketing">Marketing</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowConvert(false)} className="flex-1 px-4 py-2 border border-gray-400 text-sm text-gray-700 tracking-wider hover:bg-gray-100 transition-all">CANCELAR</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-700 to-green-500 text-white text-sm font-medium tracking-wider hover:shadow-lg transition-all disabled:opacity-50">
                  {saving ? 'CONVIRTIENDO...' : 'CONVERTIR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
