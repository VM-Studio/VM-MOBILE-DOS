'use client'

import { useState } from 'react'

interface DownloadPDFButtonProps {
  type: 'invoice' | 'project'
  id: string
  filename?: string
  params?: Record<string, string>
  variant?: 'primary' | 'outline'
  label?: string
}

export default function DownloadPDFButton({
  type,
  id,
  filename,
  params,
  variant = 'outline',
  label = 'Descargar PDF',
}: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('vm_token') ?? ''
      const queryString = params
        ? '?' + new URLSearchParams(params).toString()
        : ''

      const res = await fetch(`/api/pdf/${type}/${id}${queryString}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Error al generar el PDF')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename ? `${filename}.pdf` : `VM-documento.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const baseClass =
    'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClass =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50'

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`${baseClass} ${variantClass}`}
      >
        {loading ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generando PDF...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {label}
          </>
        )}
      </button>
      {error && (
        <span className="text-[10px] text-red-500">{error}</span>
      )}
    </div>
  )
}
