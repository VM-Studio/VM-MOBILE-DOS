'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface MercadoPagoButtonProps {
  invoiceId: string
  amount: number
  baseAmount?: number
}

export default function MercadoPagoButton({ invoiceId, amount, baseAmount }: MercadoPagoButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, amount }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar el pago')
      }

      window.location.href = data.initPoint
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Monto */}
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">Total a pagar</p>
        <p className="mt-1 text-2xl font-light text-gray-900">
          ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </p>
        {baseAmount !== undefined && (
          <div className="mt-2 flex flex-col gap-0.5">
            <p className="text-[10px] text-gray-400">
              Subtotal:{' '}
              <span className="text-gray-600">
                ${baseAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </p>
            <p className="text-[10px] text-amber-600">
              Recargo MercadoPago (5%):{' '}
              <span className="font-medium">
                +${(amount - baseAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Métodos aceptados */}
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-2">Aceptamos</p>
        <div className="flex flex-wrap gap-2">
          {['Tarjeta de crédito', 'Tarjeta de débito', 'Dinero en cuenta', 'Cuotas sin interés'].map((m) => (
            <span key={m} className="text-[10px] font-medium tracking-wide text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 uppercase">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={handlePay}
              className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Botón */}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium tracking-wider uppercase transition-colors"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Redirigiendo...
          </>
        ) : (
          <>
            <ExternalLink size={16} />
            Pagar con MercadoPago
          </>
        )}
      </button>

      <p className="text-center text-[10px] text-gray-400 tracking-wide">
        Serás redirigido al sitio seguro de MercadoPago
      </p>
    </div>
  )
}
