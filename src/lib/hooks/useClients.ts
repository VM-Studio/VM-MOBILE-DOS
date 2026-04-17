import useSWR from 'swr'

// Para el admin — lista de clientes con búsqueda
export function useAdminClients(search?: string, limit = 30) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('limit', String(limit))

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/clients?${params.toString()}`
  )
  return {
    clients: data?.clients ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Para detalle de un cliente
export function useClient(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/admin/clients/${id}` : null
  )
  return {
    data: data ?? null,
    client: data?.client ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}
