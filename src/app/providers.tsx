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
        // Don't re-fetch all data every time the user switches tabs or
        // clicks back on the window — the app already uses explicit mutations
        // (mutate/refresh) after actions and polling for messages/notifications.
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        // Dedupe identical requests within a 10s window to avoid redundant
        // parallel fetches when multiple components mount at the same time.
        dedupingInterval: 10000,
        errorRetryCount: 3,
        shouldRetryOnError: true,
      }}
    >
      {children}
    </SWRConfig>
  )
}
