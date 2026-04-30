const CACHE_VERSION = 'open-v3'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`

const APP_SHELL = [
  '/',
  '/dashboard',
  '/offline.html',
  '/manifest.webmanifest',
  '/open-icon.svg',
  '/open-icon-maskable.svg',
]

// --- Install: pre-cache app shell ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

// --- Activate: purge old caches ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// --- Message: allow app to trigger skipWaiting for updates ---
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// --- Fetch ---
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET and http(s)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return

  // Supabase API + auth — always network, never cache
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) return

  // Google Fonts — network with cache fallback (non-critical)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone()
            caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone))
          }
          return res
        })
      }),
    )
    return
  }

  // Vite-built assets (/assets/*.js, /assets/*.css) — cache-first, update in background
  if (url.pathname.startsWith('/assets/') || url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone))
          }
          return res
        })
        return cached || networkFetch
      }),
    )
    return
  }

  // Navigation requests (HTML) — network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then(
          (cached) => cached || caches.match('/offline.html'),
        ),
      ),
    )
    return
  }

  // Everything else — network-first, silent fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  )
})

// --- Push notifications ---
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'OPEN', body: event.data.text() } }

  event.waitUntil(
    self.registration.showNotification(data.title || 'OPEN Tennis', {
      body: data.body || '',
      icon: '/open-icon.svg',
      badge: '/open-icon.svg',
      tag: data.tag || 'open-notification',
      data: { href: data.href || '/dashboard' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const href = event.notification.data?.href || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(href)
          return client.focus()
        }
      }
      return clients.openWindow(href)
    }),
  )
})
