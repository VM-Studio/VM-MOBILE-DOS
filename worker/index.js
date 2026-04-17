// worker/index.js
// Este archivo se combina con el SW de next-pwa

// CRÍTICO: skipWaiting + clients.claim para que el SW tome control inmediatamente.
self.addEventListener('install', function() {
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim())
})
