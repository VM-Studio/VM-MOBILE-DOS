'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CaseStudy {
  id: string
  image: string
  isVideo?: boolean
  industry: string
  title: string
  excerpt: string
  slug: string
}

const cases: CaseStudy[] = [
  {
    id: '1',
    image: '/eticketproo.gif',
    industry: 'EVENTOS & ENTRETENIMIENTO',
    title: 'E-ticketpro: La ticketera del futuro',
    excerpt: 'Desarrollamos una plataforma completa para la venta de entradas online, con sistema de gestión para organizadores de eventos y experiencia optimizada para compradores.',
    slug: 'https://e-ticketpro.com/',
  },
  {
    id: '2',
    image: '/yesica-oviedo.gif',
    industry: 'REAL ESTATE',
    title: 'Yesica Oviedo: Desarrollo Inmobiliario',
    excerpt: 'Desarrollamos una página web completa con formulario de contacto, optimización de SEO, blog con artículos, llamadas a la acción y otras características.',
    slug: 'https://yesicaoviedo.com/',
  },
  {
    id: '3',
    image: '/ajr.gif',
    industry: 'SEGUROS',
    title: 'Organización AJR: Broker de Seguros',
    excerpt: 'Creamos una página web para el broker de seguros AJR, optimizada para búsquedas locales en Google, perfiles de Google My Business y formularios de contacto.',
    slug: 'https://www.organizacionajr.com/',
  },
  {
    id: '4',
    image: '/aspen.gif',
    industry: 'BANDA MUSICAL',
    title: 'The Aspen Sound: Banda en vivo',
    excerpt: 'Desarrollamos una página web para la reconocida banda The Aspen Sound, presentando su repertorio, historial de eventos y formularios de contratación.',
    slug: 'https://www.theaspensound.com/',
  },
  {
    id: '5',
    image: '/allbroker.gif',
    industry: 'BROKER DE SEGUROS',
    title: 'All Broker',
    excerpt: 'Desarrollamos una página web para un broker de seguros en Buenos Aires con secciones informativas, formularios de contacto y presencia en Google.',
    slug: 'https://www.allbrokersrl.com/',
  },
  {
    id: '6',
    image: '/kudu.mp4',
    isVideo: true,
    industry: 'ELECTRODOMÉSTICOS DE COCINA',
    title: 'Kudu',
    excerpt: 'Desarrollamos una página web con catálogo interactivo completo para el representante oficial de KUDU en Buenos Aires, con SEO y formulario de contacto.',
    slug: 'https://kuduobras.com/',
  },
]

const visibleCases = cases.slice(0, 3)
const hiddenCases = cases.slice(3)

const CaseStudies = () => {
  const [showMore, setShowMore] = useState(false)

  return (
    <section id="casos" className="py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-3">
          <div>
            <span className="text-[11px] font-medium tracking-[0.2em] text-gray-500">[ CASOS DE ESTUDIO ]</span>
            <h2 className="mt-4 text-[clamp(1.8rem,5vw,3rem)] font-light text-black leading-tight">
              Proyectos que cambiaron{' '}
              <span className="font-medium bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                empresas
              </span>
            </h2>
          </div>
          <Link
            href="/casos-de-estudio"
            className="mt-4 md:mt-0 text-sm font-medium text-blue-600 hover:underline shrink-0"
          >
            Ver todos →
          </Link>
        </div>

        {/* First row — always visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCases.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>

        {/* Extra cards — expand on click */}
        {showMore && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {hiddenCases.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        )}

        {/* Toggle button */}
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowMore((prev) => !prev)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-wider transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {showMore ? 'Ver menos' : 'Ver todos los proyectos'}
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${showMore ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

function CaseCard({ c }: { c: CaseStudy }) {
  return (
    <a
      href={c.slug}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white border border-gray-200 overflow-hidden hover:border-blue-500 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 block"
    >
      {/* Media */}
      <div className="relative w-full h-52 bg-gray-100 overflow-hidden">
        {c.isVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          >
            <source src={c.image} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image}
            alt={c.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="text-[10px] font-medium tracking-[0.18em] text-gray-400 uppercase">
          {c.industry}
        </div>
        <h3 className="mt-2 text-base font-medium text-black group-hover:text-blue-600 transition-colors leading-snug">
          {c.title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 font-light leading-relaxed line-clamp-3">
          {c.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
          Ver página web
          <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </div>
    </a>
  )
}

export default CaseStudies
