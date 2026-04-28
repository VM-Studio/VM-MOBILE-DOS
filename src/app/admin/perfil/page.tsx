'use client'

import { useEffect, useState } from 'react'
import SignaturePanel from '@/components/admin/perfil/SignaturePanel'

interface AdminProfile {
  name: string
  email: string
  role: string
  signatureData?: string | null
  signatureUpdatedAt?: string | null
}

export default function AdminPerfilPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    const token = localStorage.getItem('vm_token')
    const res = await fetch('/api/admin/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(data.user)
    }
    setLoading(false)
  }

  useEffect(() => { fetchProfile() }, [])

  if (loading) return <div className="p-8 text-sm text-gray-400">Cargando...</div>
  if (!profile) return <div className="p-8 text-sm text-red-400">No se pudo cargar el perfil.</div>

  const roleLabel: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    empleado: 'Empleado',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">[ MI PERFIL ]</span>
        <h1 className="mt-2 text-2xl font-light text-gray-900">{profile.name}</h1>
        <p className="mt-1 text-sm text-gray-400 font-light">{profile.email}</p>
        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 tracking-wider uppercase">
          {roleLabel[profile.role] ?? profile.role}
        </span>
      </div>

      {/* Firma */}
      <SignaturePanel
        currentSignature={profile.signatureData}
        updatedAt={profile.signatureUpdatedAt}
        onSaved={fetchProfile}
      />
    </div>
  )
}
