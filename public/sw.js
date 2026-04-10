const CACHE_NAME = 'chiqueteza-v1'
const STATIC_ASSETS = ['/', '/app', '/manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('fetch', (e) => {
  // Cache first para assets estáticos
  if (e.request.destination === 'image' ||
      e.request.url.includes('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
          return response
        })
      )
    )
    return
  }
  // Network first para API calls
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
})

// ─── Push Notifications ───────────────────────────────────────────────

self.addEventListener('push', (e) => {
  if (!e.data) return

  let payload
  try {
    payload = e.data.json()
  } catch {
    payload = { title: 'Chiqueteza', body: e.data.text() }
  }

  const title = payload.title ?? 'Chiqueteza'
  const options = {
    body: payload.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: { url: payload.url ?? '/app' },
    tag: payload.tag ?? 'chiqueteza-notification',
    renotify: true,
    vibrate: [200, 100, 200],
  }

  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/app'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tem aba aberta do app, focar nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Senão, abrir nova aba
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
