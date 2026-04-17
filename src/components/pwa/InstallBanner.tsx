'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Share, PlusSquare, Download } from 'lucide-react'

const DISMISS_KEY = 'vm_install_banner_dismissed'
const DISMISS_DAYS = 7

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS] = useState(false)

  useEffect(() => {
    // No mostrar si fue descartado recientemente
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const since = Date.now() - parseInt(dismissed, 10)
      if (since < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    // Detectar iOS Safari (no soporta beforeinstallprompt)
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as Navigator & { standalone?: boolean }).standalone

    if (isIOS) {
      setShowIOS(true)
      return
    }

    // Android / Chrome: escuchar beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowAndroid(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShowAndroid(false)
    setShowIOS(false)
  }

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowAndroid(false)
    }
    setDeferredPrompt(null)
  }

  if (!showAndroid && !showIOS) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-white shadow-2xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Image
          src="/log.png"
          alt="VM Studio"
          width={48}
          height={48}
          className="rounded-xl"
        />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">VM Studio</p>
          <p className="text-xs text-gray-500">vmstudio.online</p>
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded-full text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Android */}
      {showAndroid && (
        <div>
          <p className="text-sm text-gray-700 mb-3">
            Instalá la app para acceder más rápido y recibir notificaciones.
          </p>
          <button
            onClick={handleInstallAndroid}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            <Download size={16} />
            Instalar app
          </button>
        </div>
      )}

      {/* iOS */}
      {showIOS && (
        <div>
          <p className="text-sm text-gray-700 mb-3">
            Instalá la app en tu iPhone:
          </p>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">
                1
              </span>
              Tocá{' '}
              <Share size={15} className="inline text-blue-600 mx-0.5" />{' '}
              <span className="font-medium">Compartir</span> en Safari
            </li>
            <li className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">
                2
              </span>
              Seleccioná{' '}
              <PlusSquare size={15} className="inline text-blue-600 mx-0.5" />{' '}
              <span className="font-medium">Agregar a pantalla de inicio</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
