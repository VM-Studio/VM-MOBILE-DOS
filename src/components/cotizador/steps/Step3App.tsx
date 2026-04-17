'use client'

const TIPOS_APP = [
  {
    key: 'web',
    emoji: '💻',
    label: 'Aplicación Web (PWA)',
    desc: 'Funciona en el browser, instalable desde el celular',
  },
  {
    key: 'mobile',
    emoji: '📱',
    label: 'Aplicación Móvil Nativa',
    desc: 'Android + iOS, disponible en Play Store y App Store',
  },
]

const RUBROS = [
  { key: 'comercio', label: 'Comercio / Ventas' },
  { key: 'gastronomia', label: 'Restaurante / Gastronomía' },
  { key: 'servicios', label: 'Servicios profesionales' },
  { key: 'salud', label: 'Salud / Bienestar' },
  { key: 'educacion', label: 'Educación' },
  { key: 'entretenimiento', label: 'Entretenimiento' },
  { key: 'otro', label: 'Otro' },
]

const EXTRAS = [
  { key: 'usuarios', label: 'Sistema de usuarios y perfiles' },
  { key: 'push', label: 'Notificaciones push' },
  { key: 'chat', label: 'Chat en tiempo real' },
  { key: 'pagos', label: 'Pagos dentro de la app' },
  { key: 'geo', label: 'Geolocalización / Mapas' },
  { key: 'dashboard', label: 'Dashboard con estadísticas' },
  { key: 'api', label: 'Integración con sistema externo' },
  { key: 'panel_admin', label: 'Panel de administración' },
  { key: 'reservas', label: 'Sistema de reservas / turnos' },
  { key: 'ecommerce', label: 'Tienda / E-commerce' },
  { key: 'multiidioma', label: 'Soporte multiidioma' },
  { key: 'offline', label: 'Modo sin conexión (offline)' },
]

interface Step3Props {
  appTipo: string
  appRubro: string
  appExtras: string[]
  onChange: (field: string, val: string | string[]) => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-2 mt-5 first:mt-0">
      {children}
    </p>
  )
}

function Check({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 border text-sm transition-all ${
        selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200'
      }`}
    >
      <span className={`inline-block w-4 h-4 border mr-3 align-middle ${selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
        {selected && <span className="block text-white text-[8px] text-center leading-4">✓</span>}
      </span>
      {label}
    </button>
  )
}

export default function Step3App({ appTipo, appRubro, appExtras, onChange }: Step3Props) {
  const toggleExtra = (key: string) => {
    const next = appExtras.includes(key)
      ? appExtras.filter((e) => e !== key)
      : [...appExtras, key]
    onChange('appExtras', next)
  }

  return (
    <div>
      <h2 className="text-xl font-light text-gray-900 mb-1">Contanos sobre tu aplicación</h2>
      <p className="text-sm text-gray-400 mb-6">Configurá los detalles de tu app</p>

      <SectionLabel>¿Qué tipo de aplicación necesitás?</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        {TIPOS_APP.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange('appTipo', t.key)}
            className={`text-left p-5 border transition-all ${
              appTipo === t.key
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200'
            }`}
          >
            <span className="text-2xl block mb-2">{t.emoji}</span>
            <p className="text-sm font-medium text-gray-900">{t.label}</p>
            <p className="text-xs text-gray-400 mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      <SectionLabel>¿Para qué rubro es tu app?</SectionLabel>
      <div className="space-y-1.5">
        {RUBROS.map((r) => (
          <button
            key={r.key}
            onClick={() => onChange('appRubro', r.key)}
            className={`w-full text-left px-4 py-3 border text-sm transition-all ${
              appRubro === r.key
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200'
            }`}
          >
            <span className={`inline-block w-4 h-4 border mr-3 align-middle ${appRubro === r.key ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
              {appRubro === r.key && <span className="block text-white text-[8px] text-center leading-4">✓</span>}
            </span>
            {r.label}
          </button>
        ))}
      </div>

      <SectionLabel>¿Qué funcionalidades necesitás? (opcional)</SectionLabel>
      <div className="space-y-1.5">
        {EXTRAS.map((e) => (
          <Check
            key={e.key}
            label={e.label}
            selected={appExtras.includes(e.key)}
            onClick={() => toggleExtra(e.key)}
          />
        ))}
      </div>
    </div>
  )
}
