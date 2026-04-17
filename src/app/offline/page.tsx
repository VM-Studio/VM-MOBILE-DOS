'use client'

import Image from 'next/image'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-xs">
        <Image
          src="/log.png"
          alt="VM Studio"
          width={80}
          height={80}
          className="rounded-2xl"
        />

        {/* Ícono wifi-off en SVG inline para no depender de Lucide en offline */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="#9CA3AF" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sin conexión</h1>
          <p className="text-sm text-gray-500">
            Revisá tu conexión a internet e intentá de nuevo.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
