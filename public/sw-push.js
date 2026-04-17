/**
 * VM Studio — Push Notification Handler
 * Este service worker maneja las notificaciones push cuando la app
 * está cerrada o en background.
 *
 * Se registra de forma independiente al SW de Workbox/PWA.
 */

self.addEventListener('push', function (event) {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'VM Studio', body: event.data.text(), url: '/' }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'VM Studio', options)
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // Si la app ya está abierta, enfocarla y navegar
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.navigate(url)
            return
          }
        }
        // Si no está abierta, abrirla
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})
