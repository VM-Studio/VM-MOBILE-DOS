const CTA = () => {
  return (
    <section id="contact" className="relative py-16 sm:py-24 lg:py-32 bg-gray-50">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-500">[ EMPEZÁ HOY ]</span>

          <h2 className="mt-8 text-[clamp(2rem,6vw,4rem)] font-light leading-[1.1] mb-8 text-black">
            <span className="block">Hagamos crecer a</span>
            <span className="block font-medium bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">tu empresa</span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-light mb-10 sm:mb-12">
            Programá una llamada de 30 minutos. Sin compromiso.
            <span className="block mt-2">Te mostramos exactamente cómo podemos hacer crecer a tu empresa.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/cotizador"
              className="inline-block px-8 sm:px-12 py-4 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-[0.98]"
            >
              CALCULAR MI PRESUPUESTO →
            </a>
            <a
              href="/contacto"
              className="inline-block px-8 sm:px-12 py-4 border border-gray-300 text-gray-700 text-sm font-medium tracking-wider transition-all duration-300 hover:border-gray-900 hover:text-gray-900 active:scale-[0.98]"
            >
              PEDIR MAQUETA WEB GRATIS
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
