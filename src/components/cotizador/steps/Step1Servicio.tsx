'use client'

const SERVICIOS = [
  { key: 'web', emoji: '🌐', label: 'Desarrollo Web', desc: 'Sitio web profesional para tu negocio' },
  { key: 'app', emoji: '📱', label: 'Aplicación', desc: 'App web o móvil nativa' },
]

interface Step1Props {
  selected: string[]
  onChange: (val: string[]) => void
}

export default function Step1Servicio({ selected, onChange }: Step1Props) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((s) => s !== key))
    } else {
      onChange([...selected, key])
    }
  }

  const isSelected = (key: string) => selected.includes(key)

  return (
    <div>
      <h2 className="text-xl font-light text-gray-900 mb-1">¿Qué necesitás para tu negocio?</h2>
      <p className="text-sm text-gray-400 mb-6">
        Calculá el precio de tu proyecto sin necesidad de registrarte
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICIOS.map((s) => (
          <button
            key={s.key}
            onClick={() => toggle(s.key)}
            className={`relative text-left p-5 border transition-all duration-200 ${
              isSelected(s.key)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            {isSelected(s.key) && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
            )}
            <span className="text-2xl block mb-2">{s.emoji}</span>
            <p className="text-sm font-medium text-gray-900">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
          </button>
        ))}
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-red-400 mt-4">Seleccioná al menos un servicio para continuar.</p>
      )}
    </div>
  )
}
