const CACHE_NAME = 'diyas-n-duas-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First Fetch Strategy with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip local development server requests (Vite dev mode)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // Skip Firebase, Firestore, Google APIs, and auth requests
  if (url.href.includes('firebase') || url.href.includes('firestore') || url.href.includes('googleapis') || url.href.includes('identitytoolkit')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response to cache for valid basic responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        if (event.request.headers.get('accept')?.includes('text/html')) {
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) {
            return indexFallback;
          }
        }

        // Return a valid empty response rather than undefined to prevent TypeError: Failed to convert value to Response
        return new Response('Network unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});

// Background Push Notification handling (FCM fallback & native Web Push)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : 'You have a new update from Diyas N Duas' };
  }

  const notificationTitle = data.notification?.title || data.title || 'Diyas N Duas Update';
  const notificationOptions = {
    body: data.notification?.body || data.body || 'New order status or festive announcement from Diyas N Duas.',
    icon: data.notification?.icon || data.icon || '/logo.png',
    badge: '/favicon.svg',
    image: data.notification?.image || data.image || '/og-home.jpg',
    tag: data.tag || 'dnd-push-tag',
    data: {
      url: data.data?.url || (data.data?.orderId ? `/order/${data.data.orderId}` : '/'),
      orderId: data.data?.orderId,
    },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
});

self.addEventListener('notificationclick', (event) => {
  const rawUrl = event.notification.data?.url || '/';
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle client postMessage requests to display notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const p = event.data.payload || {};
    const title = p.title || 'Diyas N Duas Update';
    const options = {
      body: p.body || '',
      icon: p.icon || '/logo.png',
      badge: '/favicon.svg',
      image: p.image,
      tag: p.tag || 'dnd-local-msg',
      data: { url: p.url || '/' },
      vibrate: [250, 100, 250, 100, 250],
      requireInteraction: true,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

