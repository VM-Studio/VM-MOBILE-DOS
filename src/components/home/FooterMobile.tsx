import Link from 'next/link'
import Image from 'next/image'

const FooterMobile = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="px-4 py-8 max-w-[900px] mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/log.png" width={44} height={44} alt="VM" />
          <p className="text-sm text-gray-600">Desarrollo de Apps y Páginas Web optimizadas para empresas locales.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-gray-900 mb-2">NAVEGACIÓN</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/">Inicio</Link></li>
              <li><Link href="/casos-de-estudio">Casos de Estudio</Link></li>
              <li><Link href="#faq">FAQ</Link></li>
              <li><a href="https://wa.me/541124508191">Pedir Maqueta Gratis</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-wider text-gray-900 mb-2">CONTACTO</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="https://wa.me/541124508191">WhatsApp</a></li>
              <li><a href="https://www.instagram.com/vmstudio.ag">Instagram</a></li>
              <li><a href="https://www.linkedin.com/company/vm-studio-ag/">LinkedIn</a></li>
              <li><a href="mailto:vmstudio.online@gmail.com">Gmail</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-wider text-gray-900 mb-2">LEGAL</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/">Privacidad</Link></li>
              <li><Link href="/">Términos</Link></li>
              <li><Link href="/">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 mt-6 text-xs text-gray-500 text-center">
          © {year} VM Studio. Buenos Aires, Argentina.
        </div>
      </div>
    </footer>
  )
}

export default FooterMobile
