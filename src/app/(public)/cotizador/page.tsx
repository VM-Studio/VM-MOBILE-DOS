import Link from 'next/link'
import CotizadorWizard from '@/components/cotizador/CotizadorWizard'

export const metadata = {
  title: 'Cotizador | VM Studio',
  description: 'Calculá el precio de tu proyecto web, app o campaña publicitaria sin registrarte.',
}

export default function CotizadorPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F7] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-light text-gray-900">
              VM <span className="text-blue-600">Studio</span>
            </span>
          </Link>
          <span className="block text-[10px] font-medium tracking-[0.25em] text-gray-400 uppercase mb-2">
            [ Cotizador ]
          </span>
          <h1 className="text-3xl font-light text-gray-900">Calculá tu presupuesto</h1>
          <p className="text-sm text-gray-400 mt-2">Sin registrarte · Sin compromiso · 100% gratis</p>
        </div>

        {/* Wizard card */}
        <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-sm">
          <CotizadorWizard />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Ya tenés cuenta?{' '}
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Accedé a tu panel
          </a>
        </p>
      </div>
    </main>
  )
}
