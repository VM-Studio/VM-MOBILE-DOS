import Link from 'next/link'

const CotizadorBanner = () => {
  return (
    <section className="py-16 sm:py-24 bg-[#0F172A]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[11px] font-medium tracking-[0.2em] text-blue-400">
            [ COTIZADOR INTELIGENTE ]
          </span>

          <h2 className="mt-6 text-[clamp(1.75rem,5vw,3.5rem)] font-light leading-[1.1] mb-6 text-white">
            <span className="block">Calculá el precio</span>
            <span className="block font-medium bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              de tu proyecto
            </span>
          </h2>

          <p className="text-lg text-gray-400 font-light max-w-xl mx-auto mb-10">
            Completá el formulario en 2 minutos y recibís una estimación real en tu email, con el PDF incluido. Sin compromiso.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/cotizador"
              className="inline-block px-8 sm:px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold tracking-widest uppercase transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-900/50 active:scale-[0.98]"
            >
              CALCULAR AHORA →
            </Link>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="text-blue-400">✓</span> Sin registro
            </span>
            <span className="flex items-center gap-2">
              <span className="text-blue-400">✓</span> PDF instantáneo
            </span>
            <span className="flex items-center gap-2">
              <span className="text-blue-400">✓</span> Sin compromiso
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CotizadorBanner
