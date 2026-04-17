import useSWR from 'swr'

// Para el cliente — sus tickets
export function useMyTickets() {
  const { data, error, isLoading, mutate } = useSWR('/api/tickets')
  return {
    tickets: data?.tickets ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Para el admin — todos los tickets con filtros
export function useAdminTickets(filters?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/tickets${filters ? `?${filters}` : ''}`
  )
  return {
    tickets: data?.tickets ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}
