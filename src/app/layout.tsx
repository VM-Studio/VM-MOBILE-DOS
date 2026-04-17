import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import MetaPixel from '../components/MetaPixel'
import { AuthProvider } from '@/context/AuthContext'
import { Providers } from './providers'
// PWA: Install banner (client) — sólo importamos el componente PWA aquí
import InstallBanner from '@/components/pwa/InstallBanner'
import SplashScreen from '@/components/pwa/SplashScreen'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Reemplazá con tu ID real del Meta Pixel
const META_PIXEL_ID = 'YOUR_PIXEL_ID_HERE'

export const metadata: Metadata = {
  title: {
    default: 'El mejor desarrollo de páginas Web para empresas - VM Studio',
    template: '%s | VM Studio',
  },
  description:
    'Diseño y desarrollo de páginas web profesionales para empresas en Argentina. Generamos clientes nuevos con páginas web de alto rendimiento y posicionamiento en Google. Garantizado en 30 días.',
  keywords:
    'desarrollo de páginas web para empresas, diseño web profesional, páginas web argentina, google ads, marketing digital, posicionamiento google, publicidad online, pilar, buenos aires',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VM Studio',
  },
  openGraph: {
    title: 'VM STUDIO - Clientes Nuevos en 30 Días Garantizado',
    description:
      'Página Web y publicidad de Google optimizada para generar clientes nuevos. Empezando este mes.',
    url: 'https://vmstudioweb.online',
    siteName: 'VM Studio',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'VM Studio' }],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VM Studio - Clientes Nuevos Garantizados',
    description: 'Página Web y publicidad optimizada para generar clientes nuevos en 30 días.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: 'https://vmstudioweb.online' },
  icons: {
    icon: '/icons/192x192.png',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'VM Studio',
    'msapplication-TileColor': '#2563EB',
    'msapplication-tap-highlight': 'no',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563EB" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* PWA meta / manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VM Studio" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Splash screen / portada para iOS (se muestra al abrir la app instalada) */}
        <link rel="apple-touch-startup-image" href="/portadaapp.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Meta Pixel */}
        <MetaPixel pixelId={META_PIXEL_ID} />

        <AuthProvider>
          <Providers>
            {children}
          </Providers>
        </AuthProvider>
        {/* Splash screen PWA — fondo negro + ícono + loader azul */}
        <SplashScreen />
        {/* Install banner PWA (solo muestra en clientes compatibles) */}
        <InstallBanner />

        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NTXMFKXN');`}
        </Script>
      </body>
    </html>
  )
}
