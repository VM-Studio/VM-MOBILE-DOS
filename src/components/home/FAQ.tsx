const FAQ = () => {
  const faqs = [
    {
      q: '¿Podés mostrarme ejemplos de otras empresas como la mía y cómo las ayudaste?',
      a: 'Sí. Sentite libre de chequear nuestros casos de estudio.'
    },
    {
      q: '¿Qué van a hacer exactamente por mi negocio?',
      a: 'Vamos a desarrollar una página web personalizada o mejorar tu página actual y, si elegís sumar el servicio de Posicionamiento en Google, la vamos a posicionar en los primeros puestos de Google.'
    },
    {
      q: '¿Cuánto tiempo va a tardar esto?',
      a: 'Dependiendo de tu proyecto, pero generalmente en los primeros 30 días.'
    },
    {
      q: '¿Cómo sé si me van a devolver el dinero?',
      a: 'Somos una compañía registrada junto a un software que desarrollamos. Trabajás con profesionales que no están interesados en llevarse una mala imagen o en perder su reputación. Cuando quieras un reintegro de tu dinero, hacénoslo saber.'
    },
    {
      q: '¿Cuánto tiempo va a tomar de mi parte?',
      a: 'Casi nada. Vos solo tenés que responder a todas las consultas que te lleguen.'
    },
    {
      q: '¿Tengo que aprender algo técnico?',
      a: 'No hay nada técnico que debas hacer. Nosotros nos encargamos de todo.'
    },
    {
      q: '¿Qué pasa si no funciona con mi tipo de negocio?',
      a: 'Nos aseguramos de traer resultados a tu exacto tipo de negocio. Tenemos cero interés en devolver el dinero y dejarnos un mal nombre. Estás en buenas manos.'
    },
    {
      q: '¿Cuánto tiempo estoy comprometido con este contrato?',
      a: 'Hay absoluto cero compromiso con nuestra oferta. Todos los meses te consultaremos si estás interesado en continuar o no.'
    },
    {
      q: '¿Puedo pensarlo y después contactarme?',
      a: 'Mejor escribinos por WhatsApp, así ya tenés nuestro contacto guardado para cuando quieras dar el paso. Te vamos a enviar material mostrando cómo es trabajar con nosotros.'
    }
  ]

  return (
    <section id="faq" className="py-16 sm:py-24 lg:py-32 bg-white">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-20">
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-500">[ PREGUNTAS FRECUENTES ]</span>
          <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-black">
            Todo lo que necesitás <span className="font-medium">saber</span>
          </h2>
        </div>

        <div className="space-y-1">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-gray-200 group">
              <details className="group">
                <summary className="flex justify-between items-center py-5 sm:py-6 cursor-pointer list-none hover:text-blue-600 transition-colors">
                  <span className="text-base sm:text-lg font-light pr-6 sm:pr-8 text-black">{f.q}</span>
                  <span className="text-2xl font-light text-gray-400 group-open:rotate-45 transition-transform duration-200 shrink-0">+</span>
                </summary>
                <div className="pb-6 pr-12">
                  <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
