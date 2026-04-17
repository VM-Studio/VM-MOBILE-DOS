'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Project {
  _id: string
  name: string
  type?: string
  closingSignature?: {
    signedAt?: string | null
    certificateUrl?: string | null
  } | null
}

interface ClosingCertificateProps {
  project: Project
}

export default function ClosingCertificate({ project }: ClosingCertificateProps) {
  const signedAt = project.closingSignature?.signedAt
  const certificateUrl = project.closingSignature?.certificateUrl

  if (!signedAt) return null

  const handleDownload = () => {
    if (!certificateUrl) return
    // Para data URL (base64 PDF), abrir en nueva pestaña
    const link = document.createElement('a')
    link.href = certificateUrl
    link.download = `Certificado-Cierre-${project.name.replace(/\s+/g, '-')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white border border-green-200 p-5 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase">
          [ CERTIFICADO DE PROYECTO ]
        </p>
        <span className="text-[10px] font-medium tracking-wider px-2.5 py-1 bg-green-100 text-green-700 uppercase">
          COMPLETADO
        </span>
      </div>

      {/* Contenido */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">{project.name}</p>
          {project.type && (
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{project.type}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Proyecto completado y firmado el{' '}
            <span className="font-medium text-[#0F172A]">
              {format(new Date(signedAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
          </p>
        </div>
      </div>

      {/* Botón descarga */}
      {certificateUrl && (
        <button
          onClick={handleDownload}
          className="mt-4 w-full py-2.5 border border-[#0F172A] text-[10px] font-medium tracking-[0.2em] text-[#0F172A] uppercase hover:bg-[#0F172A] hover:text-white transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          DESCARGAR CERTIFICADO PDF
        </button>
      )}
    </div>
  )
}
