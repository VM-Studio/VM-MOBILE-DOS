'use client'

import { useState } from 'react'
import { Copy, Check, Building2, ArrowRight } from 'lucide-react'
import TransferComprobanteForm from './TransferComprobanteForm'

interface TransferModalProps {
  invoiceId: string
  amount: number
  onSuccess: () => void
}

const TRANSFER_DATA = {
  alias: process.env.NEXT_PUBLIC_TRANSFER_ALIAS || 'vmstudio.pago',
  cbu: process.env.NEXT_PUBLIC_TRANSFER_CBU || '—',
  titular: process.env.NEXT_PUBLIC_TRANSFER_TITULAR || 'VM Studio',
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 px-4 py-3 gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-0.5">{label}</p>
        <p className="text-sm font-mono text-gray-900 truncate">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-xs text-gray-600 hover:text-gray-900 shrink-0"
      >
        {copied ? <Check size={12} className="text-blue-600" /> : <Copy size={12} />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

export default function TransferModal({ invoiceId, amount, onSuccess }: TransferModalProps) {
  const [step, setStep] = useState<1 | 2>(1)

  if (step === 2) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setStep(1)}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors text-left tracking-wide"
        >
          ← Volver a los datos bancarios
        </button>
        <TransferComprobanteForm invoiceId={invoiceId} onSuccess={onSuccess} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Transferencia bancaria</p>
          <p className="text-xs text-gray-500 font-light">Realizá la transferencia por el monto exacto</p>
        </div>
      </div>

      {/* Monto */}
      <div className="bg-blue-600 p-4">
        <p className="text-[10px] font-medium tracking-wider text-blue-200 uppercase mb-1">Monto a transferir</p>
        <p className="text-2xl font-light text-white">
          ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Datos bancarios */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-1">Datos bancarios</p>
        <CopyField label="Alias" value={TRANSFER_DATA.alias} />
        <CopyField label="CBU" value={TRANSFER_DATA.cbu} />
        <div className="flex items-center bg-white border border-gray-200 px-4 py-3">
          <div>
            <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase mb-0.5">Titular</p>
            <p className="text-sm text-gray-900">{TRANSFER_DATA.titular}</p>
          </div>
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-yellow-50 border border-yellow-200 px-4 py-3">
        <p className="text-[10px] font-medium tracking-wider text-yellow-700 uppercase mb-1">⚠ Importante</p>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>Transferí el monto <strong className="text-gray-900">exacto</strong> indicado arriba</li>
          <li>El pago se acredita en 1–2 días hábiles</li>
          <li>Guardá el comprobante para el siguiente paso</li>
        </ul>
      </div>

      {/* Botón siguiente */}
      <button
        onClick={() => setStep(2)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider uppercase hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
      >
        Ya transferí, adjuntar comprobante
        <ArrowRight size={16} />
      </button>
    </div>
  )
}
