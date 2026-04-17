'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, registerUser, fetchMe, logoutUser } from '@/services/authService'
import type { UserRole } from '@/lib/models/User'

export interface AuthUser {
  _id: string
  name: string
  email: string
  company?: string
  role: UserRole
  isVerified: boolean
  avatar?: string
  phone?: string
}

interface RegisterData {
  name: string
  email: string
  password: string
  company?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  role: UserRole | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<{ message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('vm_token')
    if (!stored) {
      setLoading(false)
      return
    }
    setToken(stored)
    fetchMe(stored)
      .then((u: AuthUser) => {
        setUser(u)
      })
      .catch(() => {
        localStorage.removeItem('vm_token')
        localStorage.removeItem('vm_user')
        document.cookie = 'vm_token=; path=/; max-age=0; SameSite=Lax'
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: newToken, user: newUser } = await loginUser(email, password)
      localStorage.setItem('vm_token', newToken)
      localStorage.setItem('vm_user', JSON.stringify({
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }))
      // Set cookie manually so the middleware can read it immediately on redirect
      const maxAge = 60 * 60 * 24 * 7 // 7 days
      document.cookie = `vm_token=${newToken}; path=/; max-age=${maxAge}; SameSite=Lax`
      setToken(newToken)
      setUser(newUser)

      // Full page navigation so the browser sends the cookie to the middleware
      if (newUser.role === 'admin' || newUser.role === 'superadmin') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    },
    []
  )

  const register = useCallback(async (data: RegisterData) => {
    return registerUser(data)
  }, [])

  const logout = useCallback(async () => {
    if (token) {
      logoutUser(token).catch(console.error)
    }
    localStorage.removeItem('vm_token')
    localStorage.removeItem('vm_user')
    // Clear cookie
    document.cookie = 'vm_token=; path=/; max-age=0; SameSite=Lax'
    setToken(null)
    setUser(null)
    router.replace('/')
  }, [token, router])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!user,
      role: user?.role ?? null,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext debe usarse dentro de <AuthProvider>')
  }
  return ctx
}

export default AuthContext
