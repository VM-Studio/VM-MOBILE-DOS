'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'

interface TransferComprobanteFormProps {
  invoiceId: string
  onSuccess: () => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024

export default function TransferComprobanteForm({
  invoiceId,
  onSuccess,
}: TransferComprobanteFormProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) return 'Tipo no permitido. Usá JPG, PNG, WEBP o PDF.'
    if (f.size > MAX_SIZE) return 'El archivo no puede superar 5MB.'
    return null
  }

  const handleFile = (f: File) => {
    const err = validateFile(f)
    if (err) { setError(err); setFile(null); return }
    setError(null)
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const token = typeof window !== 'undefined' ? localStorage.getItem('vm_token') ?? '' : ''

    const formData = new FormData()
    formData.append('invoiceId', invoiceId)
    if (file) formData.append('comprobante', file)

    try {
      const res = await fetch('/api/payments/transfer/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      setSuccess(true)
      // Si hay proyecto con firma pendiente, redirigir directamente a la página de firma
      if (data.signatureProjectId) {
        setTimeout(() => router.push(`/dashboard/firmar/${data.signatureProjectId}`), 1200)
      } else {
        setTimeout(() => onSuccess(), 1500)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar comprobante')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center bg-white border border-gray-200 px-6">
        <div className="w-12 h-12 bg-green-50 border border-green-200 flex items-center justify-center">
          <CheckCircle size={24} className="text-green-600" />
        </div>
        <p className="font-medium text-gray-900">¡Comprobante enviado!</p>
        <p className="text-xs text-gray-500 font-light max-w-xs">
          Estamos verificando tu pago. Te notificaremos cuando sea confirmado.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500 font-light">
        Adjuntá el comprobante (JPG, PNG, WEBP o PDF · máx. 5MB).
      </p>

      {/* Zona drag & drop */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center gap-2
          border-2 border-dashed p-8 cursor-pointer transition-colors
          ${dragging
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />

        {file ? (
          <>
            <FileText size={28} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-900">{file.name}</span>
            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="absolute top-2 right-2 p-1 border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
            >
              <X size={13} className="text-gray-500" />
            </button>
          </>
        ) : (
          <>
            <Upload size={28} className="text-gray-300" />
            <span className="text-xs text-gray-500">
              Arrastrá tu comprobante o <span className="text-blue-600 font-medium">hacé clic</span>
            </span>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      {/* Botón enviar */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider uppercase hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        {loading ? 'Enviando...' : 'Enviar comprobante'}
      </button>

      {/* Enviar sin comprobante */}
      {!file && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="text-xs text-center text-gray-400 hover:text-gray-600 underline transition-colors disabled:opacity-50"
        >
          Enviar sin comprobante
        </button>
      )}
    </div>
  )
}
