import useSWR from 'swr'

// Para la lista de salas/conversaciones del cliente
export function useRooms() {
  const { data, error, isLoading, mutate } = useSWR('/api/messages')
  return {
    rooms: data?.rooms ?? [],
    totalUnread: data?.totalUnread ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Para los mensajes de una sala — polling cada 5 segundos
export function useMessages(roomId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    roomId ? `/api/messages/${roomId}` : null,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  )
  return {
    messages: data?.messages ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}
