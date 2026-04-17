'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Clock, X } from 'lucide-react'
import PaymentModal from '@/components/payments/PaymentModal'
import DownloadPDFButton from '@/components/pdf/DownloadPDFButton'
import { useMyInvoices } from '@/lib/hooks/useInvoices'
import { useMyProjects } from '@/lib/hooks/useProjects'
import ClosingSignatureModal from '@/components/client/proyecto/ClosingSignatureModal'
import useAuth from '@/hooks/useAuth'

interface InvoiceItem { description: string; quantity: number; unitPrice: number }
interface Invoice {
  _id: string
  number: string
  description: string
  items: InvoiceItem[]
  amount: number
  status: 'pendiente' | 'verificando' | 'pagado' | 'vencido' | 'rechazado'
  issuedAt: string
  dueDate?: string
  paidAt?: string
  paymentMethodNew?: 'mercadopago' | 'transferencia' | null
  transferEnviadoAt?: string | null
  transferMotivoRechazo?: string | null
  // Campos nuevos de facturación automática
  invoiceType?: 'anticipo' | 'saldo_final' | 'manual'
  installment?: number | null
  totalInstallments?: number | null
  paymentEnabled?: boolean
  enabledAt?: string | null
}

type Filter = 'todas' | 'pendiente' | 'verificando' | 'pagado' | 'vencido'

const STATUS_COLORS: Record<string, string> = {
  pagado: 'bg-green-100 text-green-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  vencido: 'bg-red-100 text-red-700',
  verificando: 'bg-blue-100 text-blue-700',
  rechazado: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  verificando: 'En verificación',
  rechazado: 'Rechazado',
}

const INVOICE_TYPE_COLORS: Record<string, string> = {
  anticipo: 'bg-yellow-100 text-yellow-700',
  saldo_final: 'bg-blue-100 text-blue-700',
}
const INVOICE_TYPE_LABELS: Record<string, string> = {
  anticipo: 'ANTICIPO',
  saldo_final: 'SALDO FINAL',
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

function PaymentFeedbackBanner({
  type,
  onClose,
}: {
  type: 'success' | 'failure' | 'pending'
  onClose: () => void
}) {
  const config = {
    success: { icon: CheckCircle, color: 'bg-green-50 border-green-200 text-green-700', msg: '¡Pago recibido! Tu pago fue procesado por MercadoPago y está siendo revisado. Te notificaremos cuando se confirme.' },
    failure: { icon: AlertCircle, color: 'bg-red-50 border-red-200 text-red-700', msg: 'El pago fue rechazado. Podés intentarlo nuevamente.' },
    pending: { icon: Clock, color: 'bg-yellow-50 border-yellow-200 text-yellow-700', msg: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.' },
  }
  const { icon: Icon, color, msg } = config[type]
  return (
    <div className={`flex items-start gap-3 border rounded-lg px-4 py-3 ${color}`}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{msg}</p>
      <button onClick={onClose}><X size={16} className="opacity-60 hover:opacity-100" /></button>
    </div>
  )
}

export default function FacturacionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const { invoices, summary, isLoading: loading, refresh } = useMyInvoices()
  const { projects, refresh: refreshProjects } = useMyProjects()
  const [filter, setFilter] = useState<Filter>('todas')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentFeedback, setPaymentFeedback] = useState<'success' | 'failure' | 'pending' | null>(null)

  // Estado directo para el proyecto con firma pendiente (independiente del caché SWR)
  const [signaturePendingProject, setSignaturePendingProject] = useState<{
    _id: string; name: string; type?: string;
    closingSignature?: { adminSignatureData?: string | null; adminName?: string | null } | null
  } | null>(null)

  // Chequea directamente en la API si hay un proyecto con awaitingSignature=true
  const checkForPendingSignature = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vm_token') ?? '' : ''
      const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      const pending = (data.projects ?? []).find(
        (p: { awaitingSignature?: boolean }) => p.awaitingSignature === true
      ) ?? null
      setSignaturePendingProject(pending)
      // También actualizar el caché SWR
      refreshProjects()
    } catch {
      // silencioso
    }
  }

  // Proyecto esperando firma — combina SWR + estado directo
  const projectPendingSignature =
    signaturePendingProject ??
    (projects.find((p: { awaitingSignature?: boolean }) => p.awaitingSignature === true) ?? null)

  // Polling: si hay facturas en verificando Y no hay firma pendiente detectada, chequear cada 3s
  const hasVerifying = invoices.some((i: Invoice) => i.status === 'verificando')
  useEffect(() => {
    if (!hasVerifying || projectPendingSignature) return
    // Chequear inmediatamente al montar
    checkForPendingSignature()
    const interval = setInterval(() => { checkForPendingSignature() }, 3000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVerifying, !!projectPendingSignature])

  // Handle MercadoPago return query params
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success' || payment === 'failure' || payment === 'pending') {
      setPaymentFeedback(payment)
      if (payment === 'success') {
        // Obtener payment_id e invoice del query param que MP añade en la back_url
        const mpPaymentId = searchParams.get('payment_id') ?? searchParams.get('paymentId')
        const invoiceId = searchParams.get('invoice')

        const verifyAndRefresh = async () => {
          // Si tenemos payment_id + invoice, verificar activamente contra la API de MP
          if (mpPaymentId && invoiceId) {
            try {
              const token = typeof window !== 'undefined' ? localStorage.getItem('vm_token') ?? '' : ''
              await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ paymentId: mpPaymentId, invoiceId }),
              })
            } catch {
              // silencioso — el webhook como fallback igualmente actualizará
            }
          }
          // Refrescar la lista de facturas
          refresh()
          checkForPendingSignature()
        }

        verifyAndRefresh()
        // Reintento con delay por si la verificación tardó un poco
        setTimeout(() => { refresh(); checkForPendingSignature() }, 3000)
      }
      router.replace('/dashboard/facturacion', { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const openPayment = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedInvoice(inv)
    setShowPaymentModal(true)
  }

  const filtered = filter === 'todas' ? invoices : invoices.filter((i: Invoice) => i.status === filter)

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'verificando', label: 'En verificación' },
    { key: 'pagado', label: 'Pagadas' },
    { key: 'vencido', label: 'Vencidas' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ FACTURACIÓN ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">Facturación</h1>
      </div>

      {/* Banner de feedback de pago */}
      {paymentFeedback && (
        <PaymentFeedbackBanner type={paymentFeedback} onClose={() => setPaymentFeedback(null)} />
      )}

      {/* Summary cards */}
      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : summary && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 p-5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total pagado</p>
            <p className="text-2xl font-light text-green-600 mt-1">${summary.totalPagado?.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 p-5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total pendiente</p>
            <p className="text-2xl font-light text-yellow-600 mt-1">${summary.totalPendiente?.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 p-5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Próximo vencimiento</p>
            <p className="text-lg font-light text-gray-900 mt-1">
              {summary.proximoVencimiento ? new Date(summary.proximoVencimiento).toLocaleDateString('es-AR') : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 w-fit">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-[10px] font-medium tracking-wider uppercase px-3 py-1.5 transition-all ${filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Invoices */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400">No hay facturas en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv: Invoice) => {
            const isAutoInvoice = inv.invoiceType === 'anticipo' || inv.invoiceType === 'saldo_final'
            const paymentBlocked = isAutoInvoice && inv.paymentEnabled === false
            const canPay = (inv.status === 'pendiente' || inv.status === 'rechazado') && !paymentBlocked

            return (
            <div key={inv._id} className="bg-white border border-gray-200">
              <div className="flex items-start sm:items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(expanded === inv._id ? null : inv._id)}>
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-gray-900">#{inv.number}</p>
                      {/* Label de cuota */}
                      {isAutoInvoice && inv.installment && inv.totalInstallments && (
                        <span className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">
                          [ CUOTA {inv.installment} DE {inv.totalInstallments} ]
                        </span>
                      )}
                      <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                      {/* Badge tipo de factura */}
                      {isAutoInvoice && inv.invoiceType && (
                        <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase ${INVOICE_TYPE_COLORS[inv.invoiceType]}`}>
                          {INVOICE_TYPE_LABELS[inv.invoiceType]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{inv.description}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Emitida: {new Date(inv.issuedAt).toLocaleDateString('es-AR')}
                      {inv.dueDate && ` · Vence: ${new Date(inv.dueDate).toLocaleDateString('es-AR')}`}
                    </p>
                    {/* Info extra según estado */}
                    {inv.status === 'verificando' && (
                      <p className="text-[10px] text-blue-500 mt-0.5">
                        🔵 Comprobante enviado el {inv.transferEnviadoAt ? new Date(inv.transferEnviadoAt).toLocaleDateString('es-AR') : '—'} — en revisión
                      </p>
                    )}
                    {inv.status === 'rechazado' && inv.transferMotivoRechazo && (
                      <p className="text-[10px] text-red-500 mt-0.5">
                        ⚠️ Rechazado: {inv.transferMotivoRechazo}
                      </p>
                    )}
                    {/* Info de disponibilidad para facturas bloqueadas */}
                    {paymentBlocked && inv.enabledAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        🔒 Disponible a partir del {new Date(inv.enabledAt).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 ml-3 shrink-0">
                  <p className="text-base sm:text-lg font-light text-gray-900">${inv.amount?.toLocaleString()}</p>
                  {canPay && (
                    <button
                      onClick={(e) => openPayment(inv, e)}
                      className="bg-gradient-to-r from-gray-900 to-blue-700 text-white text-[10px] font-medium tracking-widest uppercase px-3 py-2 whitespace-nowrap transition-opacity hover:opacity-90">
                      {inv.status === 'rechazado' ? 'Reintentar' : 'Pagar'}
                    </button>
                  )}
                  {paymentBlocked && inv.enabledAt && (
                    <button
                      disabled
                      className="flex items-center gap-1.5 bg-gray-100 text-gray-400 text-[10px] font-medium tracking-widest uppercase px-3 py-2 whitespace-nowrap opacity-50 cursor-not-allowed">
                      🔒 Disponible el {new Date(inv.enabledAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </button>
                  )}
                  <DownloadPDFButton
                    type="invoice"
                    id={inv._id}
                    filename={`VM-Factura-${inv.number}`}
                    variant="outline"
                    label="PDF"
                  />
                  <span className="text-gray-400 text-xs">{expanded === inv._id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded === inv._id && inv.items.length > 0 && (
                <div className="border-t border-gray-100 px-4 sm:px-5 pb-4">
                  <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mt-3 mb-2">Detalle</p>
                  <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[360px]">
                    <thead>
                      <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-1">Descripción</th><th className="pb-1">Cant.</th><th className="pb-1 text-right">Precio unit.</th><th className="pb-1 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items.map((item: InvoiceItem, i: number) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-1.5 text-gray-700">{item.description}</td>
                          <td className="py-1.5 text-gray-700">{item.quantity}</td>
                          <td className="py-1.5 text-gray-700 text-right">${item.unitPrice?.toLocaleString()}</td>
                          <td className="py-1.5 text-gray-700 text-right">${(item.quantity * item.unitPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
            )
          })}
        </div>
      )}

      {/* Modal de pago */}
      {selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          isOpen={showPaymentModal}
          onClose={() => { setShowPaymentModal(false); setSelectedInvoice(null) }}
          onSuccess={() => {
            refresh()
            checkForPendingSignature()
            setTimeout(() => checkForPendingSignature(), 2000)
            setShowPaymentModal(false)
            setSelectedInvoice(null)
          }}
        />
      )}

      {/* Modal de firma digital — aparece si hay un proyecto esperando firma */}
      {projectPendingSignature && (
        <ClosingSignatureModal
          project={projectPendingSignature}
          clientName={user?.name ?? 'Cliente'}
          onSigned={() => {
            setSignaturePendingProject(null)
            refreshProjects()
          }}
        />
      )}
    </div>
  )
}
