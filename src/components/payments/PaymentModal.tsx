'use client'

import { useState } from 'react'
import { X, CreditCard, Building2 } from 'lucide-react'
import MercadoPagoButton from './MercadoPagoButton'
import TransferModal from './TransferModal'

interface PaymentModalProps {
  invoice: {
    _id: string
    number: string
    description: string
    amount: number
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Method = null | 'mp' | 'transfer'

export default function PaymentModal({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<Method>(null)

  if (!isOpen) return null

  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-md bg-gray-50 border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 bg-white">
          <div>
            <span className="text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase">[ FACTURACIÓN ]</span>
            <h2 className="mt-1 text-lg font-light text-gray-900">Pagar factura</h2>
            <p className="text-xs text-gray-500 font-light">
              #{invoice.number} —{' '}
              <span className="font-medium text-gray-900">
                ${invoice.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {method === null && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium tracking-wider text-gray-400 uppercase mb-1">
                Elegí el método de pago
              </p>

              {/* Opción MercadoPago */}
              <button
                onClick={() => setMethod('mp')}
                className="group flex items-center gap-4 w-full p-4 bg-white border border-gray-200 hover:border-blue-600 hover:bg-blue-50/40 transition-all text-left"
              >
                <div className="w-11 h-11 bg-blue-600 flex items-center justify-center shrink-0">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">MercadoPago</p>
                  <p className="text-xs text-gray-500 font-light">
                    Tarjeta de crédito / débito · Cuotas · Dinero en cuenta
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-0.5">+ 5% de recargo por uso de plataforma</p>
                </div>
                <span className="text-gray-300 group-hover:text-blue-600 transition-colors text-sm">→</span>
              </button>

              {/* Opción Transferencia */}
              <button
                onClick={() => setMethod('transfer')}
                className="group flex items-center gap-4 w-full p-4 bg-white border border-gray-200 hover:border-blue-600 hover:bg-blue-50/40 transition-all text-left"
              >
                <div className="w-11 h-11 bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Transferencia bancaria</p>
                  <p className="text-xs text-gray-500 font-light">
                    CBU / Alias · Confirmación en 1–2 días hábiles
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">Sin recargo</p>
                </div>
                <span className="text-gray-300 group-hover:text-blue-600 transition-colors text-sm">→</span>
              </button>
            </div>
          )}

          {method === 'mp' && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setMethod(null)}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors text-left tracking-wide"
              >
                ← Volver a métodos de pago
              </button>
              <MercadoPagoButton
                invoiceId={invoice._id}
                amount={Math.round(invoice.amount * 1.05 * 100) / 100}
                baseAmount={invoice.amount}
              />
            </div>
          )}

          {method === 'transfer' && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setMethod(null)}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors text-left tracking-wide"
              >
                ← Volver a métodos de pago
              </button>
              <TransferModal
                invoiceId={invoice._id}
                amount={invoice.amount}
                onSuccess={handleSuccess}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
