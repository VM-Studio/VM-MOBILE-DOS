const Methodology = () => {
  const steps = [
    {
      number: '01',
      title: 'Planeamos tu éxito',
      description: 'Estudiamos tu mercado, empresa y competencia. Planificamos una solución personalizada para vos y te armamos una maqueta web gratis para que tengas un parámetro real de cómo se vería tu web nueva o remodelada.',
      duration: '48 HORAS'
    },
    {
      number: '02',
      title: 'Comunicación y desarrollo',
      description: 'Te vamos mostrando avances semanales mientras desarrollamos tu app o página web.',
      duration: 'SEMANALMENTE'
    },
    {
      number: '03',
      title: 'Mantenimiento mensual',
      description: 'Realizamos cambios, modificaciones que necesites y mantenemos todo actualizado a las últimas tecnologías. (Opcional)',
      duration: 'MENSUAL'
    }
  ]

  return (
    <section id="process" className="py-16 sm:py-24 lg:py-32 bg-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12 sm:mb-20">
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-500">[ METODOLOGÍA ]</span>
          <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-black">
            Cómo <span className="font-medium">trabajamos</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 items-start">
          {steps.map((s, i) => (
            <div key={i} className="relative group flex flex-col h-full">
              <div className="relative flex flex-col flex-1">
                <span className="text-5xl font-light text-blue-300 group-hover:text-blue-600 transition-colors duration-300">
                  {s.number}
                </span>
                <h3 className="mt-4 text-xl font-medium mb-2 text-black">{s.title}</h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">{s.description}</p>
                <span className="text-xs font-medium text-blue-600 tracking-wider mt-auto">{s.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Methodology
