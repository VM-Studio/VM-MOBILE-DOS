"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const NavbarMobile: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navItems = [
    { href: '/', label: 'INICIO' },
    { href: '/casos-de-estudio', label: 'CASOS DE ESTUDIO' },
    { href: '/contacto', label: 'CONTACTO' }
  ]

  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      e.preventDefault()
      const id = href.replace('/#', '')
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      setOpen(false)
    } else {
      setOpen(false)
    }
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out bg-white ${isScrolled ? 'border-b border-gray-200 shadow-sm' : ''}`}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image src="/log.png" width={60} height={60} alt="VM Studio" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={(e) => handleAnchor(e, n.href)}
                  className="text-[11px] font-medium tracking-widest text-gray-600 hover:text-black transition-colors duration-200"
                >
                  {n.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <Link
              href="/login"
              className="hidden md:inline-block px-6 py-2 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-[11px] font-medium tracking-widest transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              INICIAR SESIÓN
            </Link>

            {/* Mobile hamburger */}
            <button
              aria-label="Abrir menú"
              className="md:hidden relative z-10 w-8 h-8 flex flex-col justify-center items-center"
              onClick={() => setOpen((s) => !s)}
            >
              <span className={`block w-5 h-[1.5px] bg-black transition-all duration-300 ease-out ${open ? 'rotate-45 translate-y-[3.75px]' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-black mt-1.5 transition-all duration-300 ease-out ${open ? '-rotate-45 -translate-y-[3.75px]' : ''}`} />
            </button>

          </div>
        </div>
      </nav>

      {/* Mobile menu con animacion */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white pt-14"
          >
            <div className="px-6 py-8">
              <div className="flex flex-col space-y-6">
                {navItems.map((n) => (
                  <a
                    key={n.href}
                    href={n.href}
                    onClick={(e) => handleAnchor(e, n.href)}
                    className="text-sm font-medium tracking-widest text-gray-600 hover:text-black transition-colors"
                  >
                    {n.label}
                  </a>
                ))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-widest text-center transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
                >
                  INICIAR SESION
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default NavbarMobile
