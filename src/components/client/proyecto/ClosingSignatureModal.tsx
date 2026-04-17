'use client'

import { useRef, useEffect, useState } from 'react'
import SignaturePad from 'signature_pad'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Project {
  _id: string
  name: string
  type?: string
  closingSignature?: {
    adminSignatureData?: string | null
    adminName?: string | null
  } | null
}

interface ClosingSignatureModalProps {
  project: Project
  clientName: string
  onSigned: (certificateUrl: string) => void
}

export default function ClosingSignatureModal({
  project,
  clientName,
  onSigned,
}: ClosingSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const adminSignatureData = project.closingSignature?.adminSignatureData ?? null
  const adminName = project.closingSignature?.adminName ?? 'VM Studio'
  const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })

  useEffect(() => {
    if (!canvasRef.current) return
    padRef.current = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: '#0F172A',
      minWidth: 1,
      maxWidth: 2.5,
    })
    const canvas = canvasRef.current
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(ratio, ratio)
    padRef.current.clear()
  }, [])

  const handleClear = () => {
    padRef.current?.clear()
    setError(null)
  }

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('vm_token') ?? '' : ''

  const handleSign = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      setError('Dibujá tu firma antes de continuar')
      return
    }
    setIsSigning(true)
    setError(null)
    try {
      const signatureData = padRef.current.toDataURL('image/png')
      const res = await fetch(`/api/projects/${project._id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ signatureData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al firmar')
      onSigned(data.certificateUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsSigning(false)
    }
  }

  return (
    /* Overlay — sin botón de cierre, SOLO se cierra al firmar */
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white my-auto">

        {/* Logo VM Studio */}
        <div className="bg-[#0F172A] px-8 py-6 text-center">
          <p className="text-white text-2xl font-light tracking-[0.3em]">
            VM <span className="text-[#2563EB] font-bold">Studio</span>
          </p>
          <p className="text-[10px] font-medium tracking-[0.3em] text-gray-400 uppercase mt-2">
            Documento de cierre de proyecto
          </p>
        </div>

        <div className="px-8 py-6">
          {/* Datos del proyecto */}
          <div className="border-b border-gray-100 pb-5 mb-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-0.5">
                  Proyecto
                </p>
                <p className="text-sm font-semibold text-[#0F172A]">{project.name}</p>
                {project.type && (
                  <p className="text-xs text-gray-400">{project.type}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-0.5">
                  Fecha
                </p>
                <p className="text-xs font-medium text-[#0F172A]">{today}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-0.5">
                Cliente
              </p>
              <p className="text-sm font-medium text-[#0F172A]">{clientName}</p>
            </div>
          </div>

          {/* Texto legal */}
          <div className="border-b border-gray-100 pb-5 mb-5">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Por medio de la presente firma, el cliente declara haber recibido conforme el
              proyecto detallado, habiendo abonado la totalidad del presupuesto acordado.
              VM Studio declara haber cumplido con todas las etapas pactadas según el alcance
              del proyecto aprobado.
            </p>
          </div>

          {/* Firma del cliente */}
          <div className="mb-5">
            <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-2">
              Tu firma
            </p>
            <div className="border border-gray-200 bg-white" style={{ height: 140 }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full touch-none cursor-crosshair block"
                style={{ height: 140 }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-[10px] text-gray-300">Dibujá tu firma aquí</p>
              <button
                onClick={handleClear}
                className="text-[10px] text-gray-400 hover:text-gray-600 underline transition"
              >
                LIMPIAR
              </button>
            </div>
          </div>

          {/* Firma de VM Studio */}
          {adminSignatureData && (
            <div className="border-t border-gray-100 pt-5 mb-5">
              <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-2">
                Firma de VM Studio
              </p>
              <div className="flex items-end gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={adminSignatureData}
                  alt="Firma de VM Studio"
                  className="h-12 object-contain"
                />
                <p className="text-xs text-gray-500 mb-1">{adminName}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 mb-4 bg-red-50 border border-red-200 px-3 py-2">
              {error}
            </p>
          )}

          {/* Disclaimer */}
          <p className="text-[9px] text-gray-400 italic mb-5 leading-relaxed">
            Al presionar &quot;FIRMAR Y CERRAR PROYECTO&quot; confirmás que estás de acuerdo con los
            términos del documento y que tu firma digital es válida y vinculante.
          </p>

          {/* Botón de firma */}
          <button
            onClick={handleSign}
            disabled={isSigning}
            className="w-full py-4 bg-gradient-to-r from-[#0F172A] to-[#2563EB] text-white text-[10px] font-medium tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-50 transition"
          >
            {isSigning ? 'PROCESANDO FIRMA...' : 'FIRMAR Y CERRAR PROYECTO'}
          </button>
        </div>
      </div>
    </div>
  )
}
