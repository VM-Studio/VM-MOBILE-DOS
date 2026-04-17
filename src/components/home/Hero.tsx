const Hero = () => {
  return (
    <section id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* LEFT: texto y botones */}
          <div className="max-w-2xl">
            <div className="mb-6 sm:mb-8">
              <span className="text-[11px] font-medium tracking-[0.2em] text-gray-500">[ GARANTIZADO EN 30 DÍAS ]</span>
            </div>

            <h1 className="text-[2.4rem] sm:text-[clamp(2rem,7vw,4.5rem)] font-light leading-[0.95] tracking-[-0.02em] mb-6 sm:mb-8">
              <span className="text-black">Desarrollamos Páginas Web de alto rendimiento para </span>
              <span className="font-medium bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">empresas.</span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 font-light">
              Creamos o renovamos tu página web y ponemos a tu empresa enfrente de personas que están activamente buscando tus servicios en Google.
              <span className="block mt-4 text-black font-normal">Empezando este mes.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/cotizador"
                className="group relative px-6 sm:px-8 py-4 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-center text-sm font-medium tracking-wider overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10">CALCULÁ TU PRESUPUESTO →</span>
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </a>
              <a
                href="/contacto"
                className="px-6 sm:px-8 py-4 text-center border border-gray-400 text-black text-sm font-medium tracking-wider hover:bg-gray-100 hover:border-blue-600 transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
              >
                PEDIR MAQUETA WEB GRATIS
              </a>
            </div>
          </div>

          {/* RIGHT: video */}
          <div className="relative mt-8 lg:mt-0">
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-2xl border border-gray-300">
              <video
                className="w-full h-full object-cover"
                playsInline
                controls
                poster="https://res.cloudinary.com/ddmezsxfc/video/upload/v1772839995/valentinavm2_iscx9n.jpg"
              >
                <source src="https://res.cloudinary.com/ddmezsxfc/video/upload/v1772839995/valentinavm2_iscx9n.mov" type="video/mp4" />
              </video>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-[1px] h-8 bg-gradient-to-b from-blue-600 to-transparent" />
      </div>
    </section>
  )
}

export default Hero
