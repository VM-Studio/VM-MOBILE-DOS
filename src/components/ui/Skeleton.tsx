// Componentes de Skeleton reutilizables para estados de carga

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
}

// Skeleton para las 4 KPI cards del dashboard
export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 p-5">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

// Skeleton para listas de proyectos / campañas / facturas
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 p-4">
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  )
}

// Skeleton para grids de 2 columnas
export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44" />
      ))}
    </div>
  )
}

// Skeleton para tabla del admin
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

// Skeleton para página de detalle
export function DetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
