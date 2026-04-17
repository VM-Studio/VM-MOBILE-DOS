'use client'

import { useRef, useEffect, useState } from 'react'
import SignaturePad from 'signature_pad'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SignaturePanelProps {
  currentSignature?: string | null
  updatedAt?: string | null
  onSaved?: () => void
}

export default function SignaturePanel({
  currentSignature,
  updatedAt,
  onSaved,
}: SignaturePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    padRef.current = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: '#0F172A',
      minWidth: 1,
      maxWidth: 2.5,
    })
    // Ajustar el canvas al tamaño real del elemento
    const canvas = canvasRef.current
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(ratio, ratio)
    padRef.current.clear()
  }, [])

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('vm_token') ?? '' : ''

  const handleSave = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      setError('Dibujá tu firma antes de guardar')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const signatureData = padRef.current.toDataURL('image/png')
      const res = await fetch('/api/admin/profile/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ signatureData }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      padRef.current?.clear()
      onSaved?.()
    } catch {
      setError('No se pudo guardar la firma')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar la firma guardada?')) return
    setIsDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/profile/signature', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) throw new Error('Error al eliminar')
      onSaved?.()
    } catch {
      setError('No se pudo eliminar la firma')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClear = () => {
    padRef.current?.clear()
    setSaved(false)
    setError(null)
  }

  return (
    <div className="bg-white border border-gray-200 p-6">
      {/* Header */}
      <p className="text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-1">
        [ MI FIRMA ]
      </p>
      <p className="text-xs text-gray-500 mb-5">
        Esta firma aparecerá en los documentos de cierre de todos los proyectos firmados
        por clientes de VM Studio.
      </p>

      {/* Firma actual */}
      {currentSignature && (
        <div className="mb-5 p-4 border border-gray-100 bg-gray-50">
          <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-2">
            Firma guardada actualmente
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSignature}
            alt="Firma actual del admin"
            className="h-16 object-contain"
          />
          {updatedAt && (
            <p className="text-[10px] text-gray-400 mt-2">
              Guardada el{' '}
              {format(new Date(updatedAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="mt-3 text-xs text-red-500 hover:text-red-700 hover:underline transition disabled:opacity-50"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar firma guardada'}
          </button>
        </div>
      )}

      {/* Canvas */}
      <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-2">
        {currentSignature ? 'Reemplazar firma' : 'Dibujá tu firma'}
      </p>
      <div className="border border-gray-200 bg-white" style={{ height: 160 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair block"
          style={{ height: 160 }}
        />
      </div>
      <p className="text-[10px] text-gray-300 mt-1 text-center">
        Dibujá tu firma aquí
      </p>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}

      {/* Botones */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleClear}
          className="flex-1 py-2.5 border border-gray-200 text-[10px] font-medium tracking-widest text-gray-500 hover:bg-gray-50 uppercase transition"
        >
          LIMPIAR
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2.5 bg-gradient-to-r from-[#0F172A] to-[#2563EB] text-white text-[10px] font-medium tracking-widest uppercase hover:opacity-90 disabled:opacity-50 transition"
        >
          {isSaving ? 'GUARDANDO...' : saved ? 'GUARDADO ✓' : 'GUARDAR FIRMA'}
        </button>
      </div>
    </div>
  )
}
