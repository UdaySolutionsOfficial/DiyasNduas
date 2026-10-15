/* eslint-disable no-undef */
// Firebase Messaging Service Worker for background notifications (runs even when webapp/browser is closed)

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase App inside Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyDe-jWhhyY8kmgS9RsnMdFeUyz_UuHS-2Y",
  authDomain: "crackers-king-6747d.firebaseapp.com",
  projectId: "crackers-king-6747d",
  storageBucket: "crackers-king-6747d.firebasestorage.app",
  messagingSenderId: "494551534412",
  appId: "1:494551534412:web:064738264f1d4dd5ab9de9"
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Diyas N Duas Update';
  const isAdminNewOrder = payload.data?.type === 'admin_new_order';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new update regarding your order or festive offers.',
    icon: payload.notification?.icon || payload.data?.icon || '/logo.png',
    badge: '/favicon.svg',
    image: payload.notification?.image || payload.data?.image || '/og-home.jpg',
    tag: payload.data?.tag || (isAdminNewOrder ? `admin-order-${payload.data?.orderId || Date.now()}` : 'dnd-notification'),
    data: {
      url: payload.data?.url || (isAdminNewOrder ? '/admin/orders' : (payload.data?.orderId ? `/order/${payload.data.orderId}` : '/my-orders')),
      orderId: payload.data?.orderId,
      type: payload.data?.type,
    },
    vibrate: [250, 100, 250, 100, 250],
    requireInteraction: true,
    actions: isAdminNewOrder ? [
      { action: 'view_orders', title: '🛍️ View In Admin' },
      { action: 'close', title: 'Dismiss' }
    ] : payload.data?.orderId ? [
      { action: 'track_order', title: '📍 Track Order' },
      { action: 'close', title: 'Dismiss' }
    ] : [
      { action: 'open_store', title: '✨ View Offer' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus or open window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  let rawUrl = event.notification.data?.url || '/';
  if (event.action === 'track_order' && event.notification.data?.orderId) {
    rawUrl = `/order/${event.notification.data.orderId}`;
  } else if (event.action === 'view_orders') {
    rawUrl = '/admin/orders';
  } else if (!rawUrl || rawUrl === '/') {
    if (event.notification.data?.orderId) {
      rawUrl = `/order/${event.notification.data.orderId}`;
    } else {
      rawUrl = '/my-orders';
    }
  }

  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus and navigate it
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window/tab
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
