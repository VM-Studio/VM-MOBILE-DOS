'use client'

import { SWRConfig } from 'swr'

// Fetcher global — incluye JWT automáticamente desde localStorage
export const fetcher = async (url: string) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('vm_token') : null

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message ?? error.error ?? 'Error al cargar los datos')
  }

  return res.json()
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        errorRetryCount: 3,
        shouldRetryOnError: true,
      }}
    >
      {children}
    </SWRConfig>
  )
}
