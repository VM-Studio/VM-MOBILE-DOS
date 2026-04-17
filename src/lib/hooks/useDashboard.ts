import useSWR from 'swr'

// Para el dashboard del admin
export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/stats')
  return {
    stats: data ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}
