'use client'

import { useAuthContext } from '@/context/AuthContext'

/**
 * Hook principal de autenticación.
 * Consume AuthContext y expone todos los valores y acciones de auth.
 */
export default function useAuth() {
  return useAuthContext()
}
