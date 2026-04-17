'use client'

const TIPOS_WEB = [
  { key: 'informativa', label: 'Web informativa / institucional' },
  { key: 'catalogo', label: 'Web con catálogo de productos (sin venta online)' },
  { key: 'ecommerce', label: 'Tienda online / E-commerce' },
  { key: 'reservas', label: 'Web con sistema de reservas / turnos' },
  { key: 'landing', label: 'Landing page (página de venta única)' },
]

const PAGINAS = [
  { key: '1-3', label: '1 a 3 páginas' },
  { key: '4-7', label: '4 a 7 páginas' },
  { key: '8+', label: '8 o más páginas' },
]

const EXTRAS = [
  { key: 'blog', label: 'Blog / Noticias' },
  { key: 'reservas', label: 'Reservas / Turnos online' },
  { key: 'carrito', label: 'Carrito de compras' },
  { key: 'catalogo', label: 'Catálogo de productos (sin compra online)' },
  { key: 'pasarela_pagos', label: 'Pasarela de pagos (MercadoPago)' },
  { key: 'login', label: 'Sistema de login de usuarios' },
  { key: 'panel_admin', label: 'Panel de administración propio' },
  { key: 'seo', label: 'Posicionamiento SEO avanzado' },
  { key: 'multiidioma', label: 'Soporte para múltiples idiomas' },
  { key: 'redes_sociales', label: 'Integración con redes sociales' },
  { key: 'analytics', label: 'Google Analytics + píxel configurado' },
  { key: 'chat', label: 'Chat en vivo' },
]

interface Step2Props {
  webTipo: string
  webPaginas: string
  webContacto: string[]
  webExtras: string[]
  onChange: (field: string, val: string | string[]) => void
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-2 mt-5 first:mt-0">
      {children}
    </p>
  )
}

export default function Step2Web({ webTipo, webPaginas, webContacto, webExtras, onChange }: Step2Props) {
  const toggleContacto = (key: string) => {
    const next = webContacto.includes(key)
      ? webContacto.filter((c) => c !== key)
      : [...webContacto, key]
    onChange('webContacto', next)
  }

  const toggleExtra = (key: string) => {
    const next = webExtras.includes(key)
      ? webExtras.filter((e) => e !== key)
      : [...webExtras, key]
    onChange('webExtras', next)
  }

  return (
    <div>
      <h2 className="text-xl font-light text-gray-900 mb-1">Contanos sobre tu web</h2>
      <p className="text-sm text-gray-400 mb-6">Sin compromiso — configurá los detalles de tu proyecto</p>

      <SectionLabel>¿Qué tipo de web necesitás?</SectionLabel>
      <div className="space-y-1.5">
        {TIPOS_WEB.map((t) => (
          <Radio
            key={t.key}
            label={t.label}
            selected={webTipo === t.key}
            onClick={() => onChange('webTipo', t.key)}
          />
        ))}
      </div>

      <SectionLabel>¿Cuántas páginas aproximadamente?</SectionLabel>
      <div className="space-y-1.5">
        {PAGINAS.map((p) => (
          <Radio
            key={p.key}
            label={p.label}
            selected={webPaginas === p.key}
            onClick={() => onChange('webPaginas', p.key)}
          />
        ))}
      </div>

      <SectionLabel>¿Cómo querés que te contacten?</SectionLabel>
      <div className="space-y-1.5">
        <Check label="WhatsApp" selected={webContacto.includes('whatsapp')} onClick={() => toggleContacto('whatsapp')} />
        <Check label="Formulario de contacto" selected={webContacto.includes('formulario')} onClick={() => toggleContacto('formulario')} />
      </div>

      <SectionLabel>¿Qué funcionalidades adicionales necesitás? (opcional)</SectionLabel>
      <div className="space-y-1.5">
        {EXTRAS.map((e) => (
          <Check
            key={e.key}
            label={e.label}
            selected={webExtras.includes(e.key)}
            onClick={() => toggleExtra(e.key)}
          />
        ))}
      </div>
    </div>
  )
}
