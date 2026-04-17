import Image from 'next/image'
import Link from 'next/link'

const Differential = () => {
  const otherItems = [
    'Contratos de 12+ meses',
    'Reportes mensuales',
    'Múltiples intermediarios',
    'Sin garantías'
  ]

  const vmItems = [
    'Si no funciona, te devolvemos tu dinero (válido para servicios de posicionamiento en Google)',
    'Llamadas semanales y reportes en tiempo real',
    'Apps, páginas web, posicionamiento en Google, lo cubrimos todo',
    'Flexibles, ningún contrato obligatorio a largo plazo'
  ]

  return (
    <section id="enterprise" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16 text-center">
          <span className="text-[11px] font-medium tracking-[0.2em] text-gray-500">[ DIFERENCIAL ]</span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-black">
            Por qué <span className="font-medium bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">nosotros</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Otros */}
          <div className="p-8 bg-gray-100 rounded-lg">
            <h3 className="text-xl font-light mb-6 text-gray-500">Otros</h3>
            <ul className="space-y-4">
              {otherItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600">
                  <span className="text-red-500 mt-0.5 text-sm">✕</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* VM */}
          <div className="px-5 sm:px-8 py-4 bg-gray-900 border border-blue-500 text-white rounded-lg">
            <Link href="/" className="flex items-center mb-4">
              <Image width={60} height={60} src="/log.png" alt="VM Studio" />
            </Link>
            <ul className="space-y-4 pb-4">
              {vmItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5 text-sm">✓</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Differential
