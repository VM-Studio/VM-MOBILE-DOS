'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import ClosingSignatureModal from '@/components/client/proyecto/ClosingSignatureModal'

interface ProjectData {
  _id: string
  name: string
  type?: string
  awaitingSignature?: boolean
  closingSignature?: {
    adminSignatureData?: string | null
    adminName?: string | null
    signedAt?: string | null
  } | null
}

export default function FirmarProyectoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('vm_token') ?? '' : ''
    fetch(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('No se pudo cargar el proyecto')
        const data = await res.json()
        setProject(data.project ?? null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500">{error ?? 'Proyecto no encontrado'}</p>
        <button
          onClick={() => router.push('/dashboard/facturacion')}
          className="text-xs text-blue-600 underline"
        >
          Volver a facturación
        </button>
      </div>
    )
  }

  // Si el proyecto ya fue firmado, redirigir al dashboard
  if (project.closingSignature?.signedAt) {
    router.replace('/dashboard')
    return null
  }

  // Si por alguna razón awaitingSignature es false, igual mostramos el modal
  // (el cliente llegó acá porque pagó)
  return (
    <div className="min-h-screen bg-gray-900">
      <ClosingSignatureModal
        project={project}
        clientName={user?.name ?? 'Cliente'}
        onSigned={() => {
          router.replace('/dashboard')
        }}
      />
    </div>
  )
}
