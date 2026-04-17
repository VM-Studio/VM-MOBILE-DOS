'use client'

import { useState } from 'react'
import Image from 'next/image'

interface DeployHistoryItem {
  deployedAt: string
  message?: string
  previewImageUrl?: string
  stagingUrl?: string
}

interface PreviewData {
  stagingUrl: string | null
  previewImageUrl: string | null
  previewUpdatedAt: string | null
  lastDeployAt: string | null
  lastDeployMessage: string | null
  deployHistory: DeployHistoryItem[]
}

interface PreviewManagerProps {
  projectId: string
  projectName: string
  initialData: PreviewData
}

function token() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('vm_token') ?? ''
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PreviewManager({ projectId, projectName, initialData }: PreviewManagerProps) {
  const [stagingUrl, setStagingUrl] = useState(initialData.stagingUrl ?? '')
  const [deployMessage, setDeployMessage] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [preview, setPreview] = useState<PreviewData>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleDeploy = async () => {
    if (!stagingUrl.trim()) {
      setError('Ingresá una URL válida para el staging.')
      return
    }
    setError(null)
    setSuccess(false)
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/admin/projects/${projectId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          stagingUrl: stagingUrl.trim(),
          message: deployMessage.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al actualizar el preview.')
      } else {
        setPreview({
          stagingUrl: data.stagingUrl ?? null,
          previewImageUrl: data.previewImageUrl ?? null,
          previewUpdatedAt: data.previewUpdatedAt ?? null,
          lastDeployAt: data.lastDeployAt ?? null,
          lastDeployMessage: data.lastDeployMessage ?? null,
          deployHistory: data.deployHistory ?? [],
        })
        setDeployMessage('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 4000)
      }
    } catch {
      setError('Error de red. Intentá de nuevo.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase block">
        [ PREVIEW EN STAGING ]
      </span>

      <div className="bg-white border border-gray-200 p-6 space-y-5">
        {/* Current screenshot */}
        {preview.previewImageUrl && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">
              [ CAPTURA ACTUAL ]
            </p>
            <div className="relative w-full aspect-video border border-gray-100 overflow-hidden bg-gray-50 group">
              <Image
                src={preview.previewImageUrl}
                alt={`Preview de ${projectName}`}
                fill
                className="object-cover object-top"
                unoptimized
              />
              {preview.stagingUrl && (
                <a
                  href={preview.stagingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 py-2 bg-white text-gray-900 text-xs font-medium tracking-widest uppercase">
                    ABRIR STAGING ↗
                  </span>
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              {preview.lastDeployAt && (
                <span>Último deploy: {formatDate(preview.lastDeployAt)}</span>
              )}
              {preview.lastDeployMessage && (
                <span className="text-gray-500 italic">&ldquo;{preview.lastDeployMessage}&rdquo;</span>
              )}
            </div>
          </div>
        )}

        {/* URL input */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">
            [ URL DE STAGING ]
          </label>
          <input
            type="url"
            value={stagingUrl}
            onChange={(e) => setStagingUrl(e.target.value)}
            placeholder="https://staging.tuproyecto.vercel.app"
            className="w-full px-4 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-600 transition-colors placeholder:text-gray-300"
          />
        </div>

        {/* Message input */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">
            [ NOTA DEL DEPLOY <span className="normal-case font-light">— opcional</span> ]
          </label>
          <input
            type="text"
            value={deployMessage}
            onChange={(e) => setDeployMessage(e.target.value)}
            placeholder="Ej: Se agregó sección hero y navegación"
            className="w-full px-4 py-2.5 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-600 transition-colors placeholder:text-gray-300"
          />
        </div>

        {/* Error / Success feedback */}
        {error && (
          <p className="text-xs text-red-500 border border-red-100 bg-red-50 px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-green-700 border border-green-100 bg-green-50 px-3 py-2">
            Preview actualizado. El cliente fue notificado.
          </p>
        )}

        {/* Deploy button */}
        <button
          onClick={handleDeploy}
          disabled={isUpdating || !stagingUrl.trim()}
          className="px-5 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-widest uppercase hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isUpdating ? 'PROCESANDO...' : 'PUBLICAR PREVIEW'}
        </button>
      </div>

      {/* Deploy history */}
      {preview.deployHistory.length > 0 && (
        <div className="bg-white border border-gray-200">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">
              [ HISTORIAL DE DEPLOYS ({preview.deployHistory.length}) ]
            </span>
            <span className="text-gray-400 text-xs">{showHistory ? '▲' : '▼'}</span>
          </button>

          {showHistory && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {preview.deployHistory.map((item, i) => (
                <div key={i} className="px-6 py-4 flex items-start gap-4">
                  {item.previewImageUrl ? (
                    <div className="relative w-20 h-12 shrink-0 border border-gray-100 overflow-hidden bg-gray-50">
                      <Image
                        src={item.previewImageUrl}
                        alt={`Deploy ${i + 1}`}
                        fill
                        className="object-cover object-top"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-12 shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
                      <span className="text-[10px] text-gray-300 tracking-wider">SIN IMG</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{formatDate(item.deployedAt)}</p>
                    {item.message && (
                      <p className="text-sm text-gray-700 mt-0.5">{item.message}</p>
                    )}
                    {item.stagingUrl && (
                      <a
                        href={item.stagingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-500 hover:text-blue-700 truncate block mt-0.5 tracking-wider"
                      >
                        {item.stagingUrl} ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
