'use client'

interface ResultadoCotizacionProps {
  nombre: string
  email: string
  total: number
  tiempoEstimado: string
  pdfUrl: string
  presupuestoNumber: string
  onReset: () => void
}

const WA_NUMBER = '5491112345678' // reemplazar con el número real de VM Studio

export default function ResultadoCotizacion({
  nombre,
  email,
  total,
  tiempoEstimado,
  pdfUrl,
  presupuestoNumber,
  onReset,
}: ResultadoCotizacionProps) {
  const waMsg = encodeURIComponent(
    `Hola! Acabo de generar el presupuesto ${presupuestoNumber} en vmstudioweb.online y quiero más información.`
  )

  return (
    <div className="text-center">
      {/* Check icon */}
      <div className="w-16 h-16 bg-blue-600 flex items-center justify-center mx-auto mb-6">
        <span className="text-white text-3xl">✓</span>
      </div>

      <h2 className="text-2xl font-light text-gray-900 mb-2">¡Tu presupuesto está listo!</h2>
      <p className="text-sm text-gray-400 mb-8">
        Hola <span className="font-medium text-gray-700">{nombre}</span>, preparamos una estimación para tu proyecto.
      </p>

      {/* Total block */}
      <div className="bg-gray-900 p-8 mb-6">
        <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-3">
          Inversión estimada
        </p>
        <p className="text-4xl font-light text-white">
          DESDE ${total.toLocaleString('es-AR')} ARS
        </p>
      </div>

      {/* Time */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-xl">⏱️</span>
        <p className="text-sm text-gray-600">
          Tiempo estimado: <span className="font-medium text-gray-900">{tiempoEstimado}</span>
        </p>
      </div>

      {/* Email notice */}
      <div className="flex items-center justify-center gap-2 mb-8 text-sm text-gray-500">
        <span>📧</span>
        <span>
          Te enviamos el presupuesto a <span className="text-gray-900 font-medium">{email}</span>
        </span>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <a
          href={pdfUrl}
          download
          className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-widest uppercase hover:opacity-90 transition-opacity"
        >
          📄 Descargar presupuesto PDF
        </a>

        <a
          href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-6 py-4 border border-gray-300 text-gray-700 text-sm font-medium tracking-widest uppercase hover:bg-gray-50 transition-colors"
        >
          💬 Hablar por WhatsApp
        </a>
      </div>

      <p className="text-sm text-gray-400 mt-6">
        Nuestro equipo te contactará en menos de <span className="font-medium text-gray-600">24 horas hábiles</span>
      </p>

      <a
        href="https://vmstudioweb.online"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-sm text-blue-600 hover:underline mt-3"
      >
        Ver nuestros casos de estudio →
      </a>

      <button
        onClick={onReset}
        className="block mx-auto mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Hacer otra cotización
      </button>
    </div>
  )
}
