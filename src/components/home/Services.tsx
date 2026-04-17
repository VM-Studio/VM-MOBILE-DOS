import Image from 'next/image'

const Services = () => {
  const services = [
    {
      title: '1. TU PÁGINA WEB OPTIMIZADA',
      subtitle: 'Diseño & Desarrollo Web',
      description: 'Creamos o renovamos tu página web para que al menos 1 de cada 10 visitas se convierta en un cliente potencial.',
      image: '/web.gif'
    },
    {
      title: '2. PRESENCIA EN GOOGLE',
      subtitle: 'Google My Business & SEO',
      description: 'En cuanto tu página web esté lista, optimizamos tu perfil de Google y lo posicionamos en los primeros puestos.',
      image: '/google.gif'
    },
    {
      title: '3. INTELIGENCIA ARTIFICIAL',
      subtitle: 'IA & Automatización',
      description: 'Si estas sobrecargado de consultas y visitas, implementamos IA para filtrar y responder a tus clientes potenciales.',
      image: '/ia.gif'
    }
  ]

  return (
    <section id="capabilities" className="py-16 sm:py-24 lg:py-32 bg-gray-50 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12 sm:mb-20">
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-500">[ SERVICIOS ]</span>
          <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-black">
            Cómo te ayudamos a<span className="font-medium bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent"> crecer</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative p-6 sm:p-8 bg-white border border-gray-200 hover:border-blue-500 transition-colors duration-300 overflow-hidden hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/30 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-full mb-6 flex items-center justify-center border border-gray-200 bg-gray-200 rounded-md">
                  <Image
                    src={service.image}
                    width={150}
                    height={150}
                    loading="lazy"
                    className="h-full w-full object-contain"
                    alt={service.title}
                  />
                </div>
                <span className="text-[10px] font-medium tracking-[0.2em] text-gray-500">{service.subtitle}</span>
                <h3 className="mt-2 text-2xl font-light mb-4 text-black">{service.title}</h3>
                <p className="text-sm text-gray-600 mb-8 leading-relaxed">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
