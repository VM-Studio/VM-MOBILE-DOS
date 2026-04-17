'use client'

import Image from 'next/image'
import Link from 'next/link'

interface ProjectPreviewProps {
  project: {
    _id: string
    name: string
    type?: string
    status: string
    progress: number
    stagingUrl?: string | null
    previewUrl?: string | null
    previewImageUrl?: string | null
    lastDeployAt?: string | null
    lastDeployMessage?: string | null
  }
  /** When true, renders a more compact card suitable for the dashboard home */
  compact?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  en_progreso: 'En progreso',
  en_revision: 'En revisión',
  completado: 'Completado',
  pausado: 'Pausado',
}

const STATUS_COLORS: Record<string, string> = {
  en_progreso: 'bg-blue-50 text-blue-700 border-blue-200',
  en_revision: 'bg-amber-50 text-amber-700 border-amber-200',
  completado: 'bg-green-50 text-green-700 border-green-200',
  pausado: 'bg-gray-100 text-gray-500 border-gray-200',
}

function formatDeployDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 2) return 'hace un momento'
  if (diffMinutes < 60) return `hace ${diffMinutes} min`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export default function ProjectPreview({ project, compact = false }: ProjectPreviewProps) {
  const siteUrl = project.stagingUrl || project.previewUrl
  if (!siteUrl) return null

  const statusLabel = STATUS_LABELS[project.status] ?? project.status
  const statusColor = STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'
  const deployDate = formatDeployDate(project.lastDeployAt)

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 overflow-hidden">
        {/* Label strip */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">
            [ EN CONSTRUCCIÓN ]
          </span>
          <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-0">
          {/* Screenshot */}
          <div className="relative w-full aspect-video bg-gray-50 border-t border-gray-100 overflow-hidden group sm:border-t-0 sm:border-r">
            {project.previewImageUrl ? (
              <>
                <Image
                  src={project.previewImageUrl}
                  alt={`Preview de ${project.name}`}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 border border-gray-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-[11px] text-gray-300 tracking-wider">CAPTURA EN PROCESO</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-5 py-5 flex flex-col justify-between border-t border-gray-100 sm:border-t-0">
            <div className="space-y-2">
              {project.type && (
                <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                  {project.type}
                </span>
              )}
              <h3 className="text-base font-light text-gray-900 leading-tight">{project.name}</h3>

              {project.lastDeployMessage && (
                <p className="text-xs text-gray-500 italic">&ldquo;{project.lastDeployMessage}&rdquo;</p>
              )}

              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
                <span>
                  Actualizado por <span className="text-gray-600">Equipo VM Studio</span>
                  {deployDate && <> · {deployDate}</>}
                </span>
              </div>

              {/* Progress */}
              <div className="pt-1">
                <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                  <span>Progreso</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 h-1">
                  <div
                    className="bg-gradient-to-r from-gray-900 to-blue-600 h-1 transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 text-center text-xs font-medium tracking-widest uppercase bg-gradient-to-r from-gray-900 to-blue-700 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                VER MI SITIO →
              </a>
              <Link
                href={`/dashboard/proyectos/${project._id}`}
                className="px-4 py-2.5 text-xs font-medium tracking-widest uppercase border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
              >
                DETALLE
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Full-width version for project detail page
  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
        <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400 uppercase">
          [ PREVIEW EN CONSTRUCCIÓN ]
        </span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
          <span className="text-[11px] text-gray-400">EN VIVO</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-5 gap-0">
        {/* Screenshot — takes 3 of 5 cols */}
        <div className="sm:col-span-3 relative w-full aspect-video bg-gray-50 border-b border-gray-100 sm:border-b-0 sm:border-r overflow-hidden group">
          {project.previewImageUrl ? (
            <>
              <Image
                src={project.previewImageUrl}
                alt={`Preview de ${project.name}`}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 flex items-end justify-start p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/40 to-transparent">
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white text-gray-900 text-xs font-medium tracking-widest uppercase"
                >
                  ABRIR EN NUEVA PESTAÑA ↗
                </a>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border border-gray-200 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <p className="text-[11px] text-gray-400 tracking-wider uppercase">Captura en proceso</p>
                <p className="text-[11px] text-gray-300">Disponible en el próximo deploy</p>
              </div>
            </div>
          )}
        </div>

        {/* Info — takes 2 of 5 cols */}
        <div className="sm:col-span-2 p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Sitio en construcción</p>
              <p className="text-lg font-light text-gray-900">{project.name}</p>
            </div>

            {project.lastDeployMessage && (
              <div className="border-l-2 border-blue-200 pl-3">
                <p className="text-xs text-gray-500 italic">{project.lastDeployMessage}</p>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Actualizado por</span>
                <span className="font-medium text-gray-700">Equipo VM Studio</span>
              </div>
              {deployDate && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Último deploy</span>
                  <span className="text-gray-600">{deployDate}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Progreso general</span>
                <span className="font-medium text-gray-700">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5">
                <div
                  className="bg-gradient-to-r from-gray-900 to-blue-600 h-1.5 transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>

          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block w-full py-3 text-center text-xs font-medium tracking-widest uppercase bg-gradient-to-r from-gray-900 to-blue-700 text-white hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
          >
            VER MI SITIO →
          </a>
        </div>
      </div>
    </div>
  )
}
