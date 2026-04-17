'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Mostrar siempre al abrir la app (standalone) o en cualquier carga
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (!isStandalone) return

    // Solo una vez por sesión
    const shownThisSession = sessionStorage.getItem('vm_splash_shown')
    if (shownThisSession) return

    sessionStorage.setItem('vm_splash_shown', '1')
    setVisible(true)
    setProgress(0)

    // Avanzar el progreso de 0 a 100 en 2000ms
    const totalDuration = 2000
    const intervalMs = 20
    const steps = totalDuration / intervalMs
    let current = 0

    const interval = setInterval(() => {
      current += 1
      // Progreso no lineal: arranca rápido, frena al final (más natural)
      const pct = Math.round((1 - Math.pow(1 - current / steps, 2)) * 100)
      setProgress(Math.min(pct, 100))

      if (current >= steps) {
        clearInterval(interval)
        // Fade out al terminar
        setTimeout(() => setFadeOut(true), 100)
        setTimeout(() => setVisible(false), 600)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px',
        transition: 'opacity 0.5s ease',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Ícono centrado */}
      <Image
        src="/appleicon.png"
        alt="VM Studio"
        width={160}
        height={160}
        priority
        style={{ borderRadius: '32px' }}
      />

      {/* Loader */}
      <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Barra + porcentaje en la misma fila */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Barra de progreso */}
          <div
            style={{
              flex: 1,
              height: '4px',
              backgroundColor: '#1e3a5f',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#2563EB',
                borderRadius: '999px',
                transition: 'width 0.02s linear',
              }}
            />
          </div>

          {/* Porcentaje al costado derecho */}
          <div
            style={{
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.03em',
              minWidth: '36px',
              textAlign: 'right',
            }}
          >
            {progress}%
          </div>
        </div>
      </div>
    </div>
  )
}
