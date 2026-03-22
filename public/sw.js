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
