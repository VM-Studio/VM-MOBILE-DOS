'use client'

import { useState } from 'react'

interface SendPDFButtonProps {
  type: 'invoice'
  id: string
  clientEmail: string
  extraParams?: Record<string, string>
}

export default function SendPDFButton({ type, id, clientEmail }: SendPDFButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!confirm(`¿Enviar factura a ${clientEmail}?`)) return
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const token = localStorage.getItem('vm_token') ?? ''
      const res = await fetch(`/api/pdf/send/${type}/${id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleSend}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Enviar por email
          </>
        )}
      </button>
      {success && (
        <span className="text-[10px] text-green-600 font-medium">✓ Enviado a {clientEmail}</span>
      )}
      {error && (
        <span className="text-[10px] text-red-500">{error}</span>
      )}
    </div>
  )
}
