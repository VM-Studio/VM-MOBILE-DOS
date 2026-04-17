'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
    {/* Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>

    <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        {/* Logo grande */}
        <div className="mb-8">
          <Image
            src="/log.png"
            width={120}
            height={120}
            alt="VM Studio"
            className="mx-auto"
          />
        </div>

        {/* Título */}
        <h1 className="text-[2rem] sm:text-[clamp(1.8rem,5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.02em] mb-4 max-w-2xl">
          <span className="text-black">Tu plataforma de desarrollo digital</span>{' '}
          <span className="font-medium bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
            en tiempo real
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg text-gray-500 font-light mb-10 max-w-sm">
          Seguí tu proyecto y tus campañas desde un solo lugar.
        </p>

        {/* Botones apilados */}
        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <Link
            href="/login"
            className="group relative px-8 py-4 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-center text-sm font-medium tracking-widest overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10">INICIAR SESIÓN</span>
            <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </Link>

          <Link
            href="/register"
            className="px-8 py-4 text-center border border-gray-400 text-black text-sm font-medium tracking-widest hover:bg-gray-100 hover:border-blue-600 transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
          >
            CREAR MI CUENTA
          </Link>
        </div>

        {/* Link externo */}
        <p className="mt-6 text-sm text-gray-500">
          ¿Todavía no cotizaste tu proyecto?{' '}
          <a
            href="https://vmstudioweb.online"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            → Visitá vmstudioweb.online
          </a>
        </p>
      </div>
    </div>

    {/* Scroll indicator */}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
      <div className="w-[1px] h-8 bg-gradient-to-b from-blue-600 to-transparent" />
    </div>
  </section>
)

/* ─────────────────────────────────────────────
   FEATURES
───────────────────────────────────────────── */
const features = [
  {
    gif: '/SEO.gif',
    title: 'Seguí tu proyecto en tiempo real',
    description:
      'Accedé al avance de tu proyecto en cada etapa, aprobá cambios y descargá archivos desde tu panel.',
  },
  {
    gif: '/GOOGLEADS.gif',
    title: 'Métricas de tus campañas',
    description:
      'Visualizá el rendimiento de tus campañas de Google Ads y Meta Ads con datos actualizados en tiempo real.',
  },
  {
    gif: '/INTELIGENCIAART.gif',
    title: 'Comunicación directa con tu equipo',
    description:
      'Hablá con el equipo de VM Studio directamente desde tu panel. Sin intermediarios, sin demoras.',
  },
]

const Features = () => (
  <section className="py-16 sm:py-24 bg-white">
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex flex-col items-center text-center p-6 sm:p-8 border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300"
          >
            {/* GIF */}
            <div className="mb-6 w-full flex justify-center">
              <img
                src={f.gif}
                alt={f.title}
                style={{ maxHeight: '200px', width: 'auto', objectFit: 'contain' }}
              />
            </div>

            {/* Título */}
            <h3 className="text-base font-medium tracking-wide text-gray-900 mb-3">
              {f.title}
            </h3>

            {/* Descripción */}
            <p className="text-sm text-gray-500 font-light leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
const Footer = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image src="/log.png" width={44} height={44} alt="VM Studio" />
          </div>

          {/* Email */}
          <a
            href="mailto:vmstudio.online@gmail.com"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            vmstudio.online@gmail.com
          </a>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/vm-studio-ag/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-gray-500 hover:text-black transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://www.instagram.com/vmstudio.ag"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-gray-500 hover:text-black transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            {/* Twitter / X */}
            <a
              href="https://twitter.com/vmstudio"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="text-gray-500 hover:text-black transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* Facebook */}
            <a
              href="https://facebook.com/vmstudio"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-gray-500 hover:text-black transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 mt-6 text-xs text-gray-500 text-center">
          © {year} VM Studio. Buenos Aires, Argentina.
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
const HomePage = () => {
  return (
    <div>
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage
