import useSWR from 'swr'

// Para el cliente — sus facturas
export function useMyInvoices() {
  const { data, error, isLoading, mutate } = useSWR('/api/invoices')
  return {
    invoices: data?.invoices ?? [],
    summary: data?.summary ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Para el admin — todas las facturas con filtros
export function useAdminInvoices(filters?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/invoices${filters ? `?${filters}` : ''}`
  )
  return {
    invoices: data?.invoices ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}
