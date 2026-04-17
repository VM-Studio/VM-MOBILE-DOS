import useSWR from 'swr'

// Para el cliente — sus proyectos
export function useMyProjects() {
  const { data, error, isLoading, mutate } = useSWR('/api/projects', {
    revalidateOnMount: true,
    revalidateOnFocus: true,
  })
  return {
    projects: data?.projects ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Para detalle de un proyecto (cliente o admin)
export function useProject(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/projects/${id}` : null
  )
  return {
    project: data?.project ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Para el admin — todos los proyectos con filtros
export function useAdminProjects(filters?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/projects${filters ? `?${filters}` : ''}`
  )
  return {
    projects: data?.projects ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Para detalle de proyecto admin
export function useAdminProject(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/admin/projects/${id}` : null
  )
  return {
    project: data?.project ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}
