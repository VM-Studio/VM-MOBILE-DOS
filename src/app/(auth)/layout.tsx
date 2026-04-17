import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    template: '%s | VM Studio',
    default: 'Autenticación | VM Studio',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar igual que el home */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/log.png" width={44} height={44} alt="VM" />
          </Link>
          <Link href="/login" className="text-sm font-medium text-gray-600">
            Iniciar Sesión
          </Link>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-24">
        <div className="w-full max-w-[440px] bg-white border border-gray-200 rounded p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

