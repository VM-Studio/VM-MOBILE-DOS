import useSWR from 'swr'

// Para las notificaciones del cliente — actualiza cada 30 segundos
export function useNotifications(limit = 30) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/notifications?limit=${limit}`,
    {
      refreshInterval: 30000,
    }
  )
  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}
