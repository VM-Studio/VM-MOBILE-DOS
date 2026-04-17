// @ts-check

/**
 * PWA: reactivada de forma condicional.
 * - next-pwa@5 es CJS; usamos createRequire para importarlo desde un archivo .mjs.
 * - La PWA se desactiva en desarrollo gracias a `disable: process.env.NODE_ENV === 'development'`.
 * - Sólo envolvemos la configuración existente con next-pwa sin eliminar nada.
 */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const withPWA = require('next-pwa')

const pwaOptions = {
  dest: 'public',
  register: false,       // ← NO registrar automáticamente (lo hacemos manualmente)
  skipWaiting: true,
  sw: 'sw.js',

  // Inyectar el custom worker (push handlers) en el sw.js generado
  customWorkerDir: 'worker',

  // CRÍTICO: solo deshabilitar en development
  disable: process.env.NODE_ENV === 'development',

  runtimeCaching: [
    // Fuentes de Google
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gstatic-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    // Imágenes estáticas
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    // Archivos estáticos de Next.js
    {
      urlPattern: /\/__next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    // Imágenes de Next.js
    {
      urlPattern: /\/_next\/image\?.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    // API routes → siempre desde la red, nunca desde caché
    // Para que los datos siempre estén actualizados
    {
      urlPattern: /^https:\/\/.*\/api\/.*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'api-cache',
      },
    },
    // Resto de páginas
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
}

// @ts-expect-error — next-pwa@5 types no son compatibles con Next.js 15, pero funciona en runtime
const withPWAPlugin = withPWA(pwaOptions)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Comprimir respuestas HTTP
  compress: true,

  // Optimización de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [390, 768, 1024, 1280],
    imageSizes: [16, 32, 64, 128, 256],
  },

  // Headers de caché para assets estáticos
  async headers() {
    return [
      {
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)\\.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)\\.jpg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)\\.jpeg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)\\.gif',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)\\.svg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)\\.ico',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)\\.webp',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ]
  },

  // Experimental — mejoras de performance
  experimental: {
    optimizePackageImports: [
      'recharts',
      'date-fns',
      '@hello-pangea/dnd',
    ],
  },
}

// @ts-expect-error — mismatch de tipos entre @types/next-pwa y next@15, no afecta el build
export default withPWAPlugin(nextConfig)
