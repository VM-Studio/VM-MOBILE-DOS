'use client'

import { useState } from 'react'
import { Check, X, Eye, Loader2 } from 'lucide-react'

interface Invoice {
  _id: string
  number: string
  status: string
  paymentMethodNew?: string | null
  transferComprobante?: string | null
  transferComprobanteNombre?: string | null
  transferEnviadoAt?: string | null
  mpPaymentId?: string | null
  mpPendingAt?: string | null
}

interface AdminPaymentActionsProps {
  invoice: Invoice
  onUpdate: (invoice: Invoice) => void
}

export default function AdminPaymentActions({ invoice, onUpdate }: AdminPaymentActionsProps) {
  const [confirming, setConfirming] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showComprobanteModal, setShowComprobanteModal] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [loadingConfirm, setLoadingConfirm] = useState(false)
  const [loadingReject, setLoadingReject] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (invoice.status !== 'verificando') return null

  const isMercadoPago = invoice.paymentMethodNew === 'mercadopago'

  const handleConfirm = async () => {
    setLoadingConfirm(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/transfer/confirm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice._id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al confirmar')
      onUpdate(data.invoice)
      setConfirming(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoadingConfirm(false)
    }
  }

  const handleReject = async () => {
    if (!motivo.trim()) {
      setError('Ingresá un motivo de rechazo')
      return
    }
    setLoadingReject(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/transfer/reject', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice._id, motivo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al rechazar')
      onUpdate(data.invoice)
      setShowRejectModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoadingReject(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 mt-2">
        {/* Info según método de pago */}
        {isMercadoPago ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-medium">
                MercadoPago
              </span>
              <span className="text-xs text-white/40">— pago aprobado por MP, pendiente de confirmación</span>
            </div>
            {invoice.mpPendingAt && (
              <p className="text-xs text-white/40">
                Recibido:{' '}
                {new Date(invoice.mpPendingAt).toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
            {invoice.mpPaymentId && (
              <p className="text-xs text-white/30 font-mono">ID MP: {invoice.mpPaymentId}</p>
            )}
          </>
        ) : (
          <>
            {invoice.transferEnviadoAt && (
              <p className="text-xs text-white/40">
                Enviado:{' '}
                {new Date(invoice.transferEnviadoAt).toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
            {invoice.transferComprobante && (
              <button
                onClick={() => setShowComprobanteModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline transition"
              >
                <Eye size={12} />
                Ver comprobante
                {invoice.transferComprobanteNombre && (
                  <span className="text-white/30 no-underline">
                    ({invoice.transferComprobanteNombre})
                  </span>
                )}
              </button>
            )}
          </>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
            {error}
          </p>
        )}

        {/* Acciones */}
        {!confirming ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition text-xs font-medium"
            >
              <Check size={13} />
              Confirmar pago
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition text-xs font-medium"
            >
              <X size={13} />
              Rechazar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-white/70 font-medium">
              ¿Confirmar el pago de la factura #{invoice.number}?
              {isMercadoPago && <span className="text-blue-300 ml-1">(MercadoPago)</span>}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={loadingConfirm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-400 disabled:opacity-50 transition text-xs font-semibold"
              >
                {loadingConfirm ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Sí, confirmar
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-xs text-white/60"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal comprobante */}
      {showComprobanteModal && invoice.transferComprobante && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowComprobanteModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white">
                {invoice.transferComprobanteNombre ?? 'Comprobante de transferencia'}
              </p>
              <button
                onClick={() => setShowComprobanteModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 flex items-center justify-center bg-black/40 min-h-[300px] max-h-[70vh] overflow-auto">
              {invoice.transferComprobante.startsWith('data:image') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={invoice.transferComprobante}
                  alt="Comprobante de transferencia"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              ) : invoice.transferComprobante.startsWith('data:application/pdf') ? (
                <iframe
                  src={invoice.transferComprobante}
                  className="w-full h-[60vh] rounded-lg border-0"
                  title="Comprobante PDF"
                />
              ) : (
                <p className="text-white/50 text-sm">No se puede previsualizar este tipo de archivo.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Rechazar comprobante</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>

            <p className="text-sm text-white/50">
              Factura #{invoice.number}. {isMercadoPago
                ? 'El pago será rechazado y la factura volverá a pendiente.'
                : 'Ingresá el motivo para que el cliente pueda corregirlo.'}
            </p>

            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: El monto no coincide, el comprobante es ilegible..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
            />

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={loadingReject}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 transition font-semibold text-sm text-white"
              >
                {loadingReject ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Rechazar
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm text-white/60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
