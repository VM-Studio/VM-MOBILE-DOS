import type { AuthUser } from '@/context/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message ?? 'Error desconocido')
  }
  return data as T
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface RegisterResponse {
  message: string
  user: AuthUser
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  return handleResponse<LoginResponse>(res)
}

export async function registerUser(data: {
  name: string
  email: string
  password: string
  company?: string
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<{ message: string }>(res)
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return handleResponse<{ message: string }>(res)
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: newPassword }),
  })
  return handleResponse<{ message: string }>(res)
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await handleResponse<{ user: AuthUser }>(res)
  return data.user
}

export async function logoutUser(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}
