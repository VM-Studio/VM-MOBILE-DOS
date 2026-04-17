'use client'

interface Step6Props {
  nombre: string
  empresa: string
  email: string
  whatsapp: string
  preferenciaContacto: string
  aceptaContacto: boolean
  onChange: (field: string, val: string | boolean) => void
  onSubmit: () => void
  isSubmitting: boolean
}

const PREFERENCIAS = [
  { key: 'whatsapp', label: 'WhatsApp (más rápido)' },
  { key: 'email', label: 'Email' },
  { key: 'llamada', label: 'Llamada telefónica' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-2 mt-5 first:mt-0">
      {children}
    </p>
  )
}

export default function Step6Datos({
  nombre, empresa, email, whatsapp, preferenciaContacto,
  aceptaContacto, onChange, onSubmit, isSubmitting
}: Step6Props) {
  return (
    <div>
      <h2 className="text-xl font-light text-gray-900 mb-1">¡Ya casi terminás!</h2>
      <p className="text-sm text-gray-400 mb-6">
        Completá tus datos para recibir tu presupuesto personalizado
      </p>

      <SectionLabel>Nombre completo *</SectionLabel>
      <input
        type="text"
        value={nombre}
        onChange={(e) => onChange('nombre', e.target.value)}
        placeholder="Juan García"
        className="w-full px-4 py-3 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
      />

      <SectionLabel>Empresa / Negocio</SectionLabel>
      <input
        type="text"
        value={empresa}
        onChange={(e) => onChange('empresa', e.target.value)}
        placeholder="Mi empresa (opcional)"
        className="w-full px-4 py-3 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
      />

      <SectionLabel>Email *</SectionLabel>
      <input
        type="email"
        value={email}
        onChange={(e) => onChange('email', e.target.value)}
        placeholder="juan@email.com"
        className="w-full px-4 py-3 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
      />

      <SectionLabel>WhatsApp *</SectionLabel>
      <input
        type="tel"
        value={whatsapp}
        onChange={(e) => onChange('whatsapp', e.target.value)}
        placeholder="+54 9 11 1234-5678"
        className="w-full px-4 py-3 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
      />

      <SectionLabel>¿Cómo preferís que te contactemos?</SectionLabel>
      <div className="space-y-1.5">
        {PREFERENCIAS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange('preferenciaContacto', p.key)}
            className={`w-full text-left px-4 py-3 border text-sm transition-all ${
              preferenciaContacto === p.key
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200'
            }`}
          >
            <span className={`inline-block w-4 h-4 border mr-3 align-middle ${preferenciaContacto === p.key ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
              {preferenciaContacto === p.key && (
                <span className="block text-white text-[8px] text-center leading-4">✓</span>
              )}
            </span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Consent */}
      <div className="mt-5">
        <button
          onClick={() => onChange('aceptaContacto', !aceptaContacto)}
          className="flex items-start gap-3 text-left w-full group"
        >
          <span className={`w-4 h-4 shrink-0 border mt-0.5 transition-colors ${aceptaContacto ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-blue-300'}`}>
            {aceptaContacto && <span className="block text-white text-[8px] text-center leading-4">✓</span>}
          </span>
          <span className="text-sm text-gray-600">
            Acepto que VM Studio me contacte con información sobre mi presupuesto
          </span>
        </button>
      </div>

      <button
        onClick={onSubmit}
        disabled={isSubmitting || !nombre || !email || !whatsapp || !aceptaContacto}
        className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Calculando presupuesto...' : 'Calcular mi presupuesto →'}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        Tu información es confidencial y solo será utilizada para preparar tu propuesta personalizada.
      </p>
    </div>
  )
}
