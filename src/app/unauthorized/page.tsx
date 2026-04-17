import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Acceso Denegado | VM Studio' }

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="text-6xl font-bold text-blue-600">403</div>
        <span className="block text-[11px] font-medium tracking-[0.2em] text-gray-500">
          [ ACCESO DENEGADO ]
        </span>
        <h1 className="text-2xl font-light text-black">
          No tenés <span className="font-semibold">permiso</span>
        </h1>
        <p className="text-sm text-gray-500">
          Tu cuenta no tiene acceso a esta sección. Si creés que es un error,
          contactate con soporte.
        </p>
        <div className="flex flex-col gap-3 mt-6">
          <Link
            href="/"
            className="w-full py-3 bg-blue-600 text-white text-sm font-semibold tracking-wider rounded text-center hover:bg-blue-700 transition-colors"
          >
            VOLVER AL INICIO
          </Link>
          <Link
            href="/login"
            className="w-full py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded text-center hover:bg-gray-50 transition-colors"
          >
            Iniciar sesión con otra cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}
