'use client'

const ETAPAS = [
  { key: 'nuevo', label: 'Estoy empezando (nuevo negocio)' },
  { key: 'sin_presencia', label: 'Tengo negocio pero sin presencia online' },
  { key: 'mejorar', label: 'Tengo presencia online pero quiero mejorarla' },
  { key: 'escalar', label: 'Ya tengo todo, quiero escalar' },
]

const CUANDO_EMPEZAR = [
  { key: 'ahora', label: 'Lo antes posible' },
  { key: '1mes', label: 'En el próximo mes' },
  { key: '2-3meses', label: 'En 2 o 3 meses' },
  { key: 'investigando', label: 'Solo estoy investigando precios' },
]

const COMO_CONOCIO = [
  { key: 'google', label: 'Google' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'recomendacion', label: 'Recomendación de alguien' },
  { key: 'otro', label: 'Otro' },
]

interface Step5Props {
  etapaNegocio: string
  tieneWeb: boolean | undefined
  urlWebActual: string
  cuandoEmpezar: string
  comoNosConocio: string
  onChange: (field: string, val: string | boolean) => void
}

function Radio({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border text-sm transition-all ${
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-2 mt-5 first:mt-0">
      {children}
    </p>
  )
}

export default function Step5General({ etapaNegocio, tieneWeb, urlWebActual, cuandoEmpezar, comoNosConocio, onChange }: Step5Props) {
  return (
    <div>
      <h2 className="text-xl font-light text-gray-900 mb-1">Unas preguntas más</h2>
      <p className="text-sm text-gray-400 mb-6">Ayudanos a entender mejor tu situación</p>

      <SectionLabel>¿En qué etapa está tu negocio?</SectionLabel>
      <div className="space-y-1.5">
        {ETAPAS.map((e) => (
          <Radio
            key={e.key}
            label={e.label}
            selected={etapaNegocio === e.key}
            onClick={() => onChange('etapaNegocio', e.key)}
          />
        ))}
      </div>

      <SectionLabel>¿Tenés sitio web actualmente?</SectionLabel>
      <div className="space-y-1.5">
        <Radio
          label="Sí"
          selected={tieneWeb === true}
          onClick={() => onChange('tieneWeb', true)}
        />
        <Radio
          label="No"
          selected={tieneWeb === false}
          onClick={() => onChange('tieneWeb', false)}
        />
      </div>
      {tieneWeb && (
        <div className="mt-3">
          <input
            type="url"
            value={urlWebActual}
            onChange={(e) => onChange('urlWebActual', e.target.value)}
            placeholder="https://tusitio.com"
            className="w-full px-4 py-3 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>
      )}

      <SectionLabel>¿Cuándo querés empezar?</SectionLabel>
      <div className="space-y-1.5">
        {CUANDO_EMPEZAR.map((c) => (
          <Radio
            key={c.key}
            label={c.label}
            selected={cuandoEmpezar === c.key}
            onClick={() => onChange('cuandoEmpezar', c.key)}
          />
        ))}
      </div>

      <SectionLabel>¿Cómo nos conociste?</SectionLabel>
      <div className="space-y-1.5">
        {COMO_CONOCIO.map((c) => (
          <Radio
            key={c.key}
            label={c.label}
            selected={comoNosConocio === c.key}
            onClick={() => onChange('comoNosConocio', c.key)}
          />
        ))}
      </div>
    </div>
  )
}
