import { db, rtdb, getMessagingInstance } from '../firebase/config';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { ref, set, get, onValue } from 'firebase/database';
import { OrderStatus } from '../types/order';

const FCM_TOKENS_COLLECTION = 'fcm_tokens';
const RTDB_SUBSCRIBERS_PATH = 'fcm_subscribers';
const LOCAL_FCM_KEY = 'dnd_fcm_token';
const NOTIFICATION_PERMISSION_KEY = 'dnd_notification_preference';

export interface DeviceSubscriber {
  token: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  platform?: string;
  language?: string;
  screen?: string;
  associatedOrderId?: string;
  createdAt: number;
  lastActive: number;
}

export interface CampaignNotification {
  id?: string;
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  target?: 'all' | 'recent_customers';
  createdAt: number;
  sentCount?: number;
}

// Audio player for modern crisp notification chime
let audioChime: HTMLAudioElement | null = null;
export const playNotificationChime = () => {
  try {
    if (!audioChime) {
      audioChime = new Audio('/notification_bell.mp3');
      audioChime.volume = 0.75;
    }
    audioChime.currentTime = 0;
    audioChime.play().catch(() => {
      // Audio playback autoplay policy catch
    });
  } catch {
    // Silently continue if audio not supported
  }
};

const playChimeAudio = playNotificationChime;

/**
 * Fetch client external IP address safely with fallback
 */
async function fetchClientIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      return data.ip || 'Unknown';
    }
  } catch {
    // fallback
  }
  return 'Unknown';
}

export const fcmService = {
  /**
   * Get device local FCM token if previously registered
   */
  getLocalToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LOCAL_FCM_KEY);
  },

  /**
   * Check if notifications are supported and current permission
   */
  getPermissionState(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  },

  /**
   * Resolve active VAPID key securely from environment configuration (.env)
   */
  async getVapidKey(): Promise<string | undefined> {
    const envKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim();
    return envKey || undefined;
  },

  /**
   * Request push permission, obtain FCM token, and register device with IP
   */
  async requestNotificationPermission(): Promise<{ success: boolean; token?: string; error?: string }> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Push notifications are not supported by this browser.' };
    }

    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);

      if (permission !== 'granted') {
        return { success: false, error: 'Notification permission was denied.' };
      }

      // Ensure service worker is registered
      let registration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
      }

      const messaging = await getMessagingInstance();
      let fcmToken = '';

      if (messaging) {
        try {
          const { getToken } = await import('firebase/messaging');
          const vapidKey = await this.getVapidKey();
          
          try {
            fcmToken = await getToken(messaging, {
              vapidKey,
              serviceWorkerRegistration: registration,
            });
          } catch (firstErr) {
            console.warn('[FCM] getToken with custom VAPID key failed, retrying without custom key:', firstErr);
            fcmToken = await getToken(messaging, {
              serviceWorkerRegistration: registration,
            });
          }
        } catch (fcmErr) {
          console.warn('[FCM] Both getToken attempts encountered error:', fcmErr);
        }
      }

      // Generate fallback token identifier if FCM VAPID is blocked or restricted
      if (!fcmToken) {
        let existingLocal = localStorage.getItem(LOCAL_FCM_KEY);
        if (!existingLocal) {
          existingLocal = `dnd_dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        fcmToken = existingLocal;
      }

      localStorage.setItem(LOCAL_FCM_KEY, fcmToken);

      // Capture device metadata & IP
      const ipAddress = await fetchClientIp();
      const subscriberData: DeviceSubscriber = {
        token: fcmToken,
        ipAddress,
        userAgent: navigator.userAgent || 'Unknown',
        platform: navigator.platform || 'Unknown',
        language: navigator.language || 'en-IN',
        screen: `${window.screen.width}x${window.screen.height}`,
        createdAt: Date.now(),
        lastActive: Date.now(),
      };

      // 1. Save to Firestore fcm_tokens collection
      try {
        const tokenRef = doc(db, FCM_TOKENS_COLLECTION, fcmToken);
        await setDoc(tokenRef, subscriberData, { merge: true });
      } catch (fsErr) {
        console.warn('[FCM] Firestore token write fallback:', fsErr);
      }

      // 2. Save to RTDB for immediate broadcasting
      try {
        const rtdbKey = fcmToken.replace(/[.#$[\]]/g, '_');
        const rtdbRef = ref(rtdb, `${RTDB_SUBSCRIBERS_PATH}/${rtdbKey}`);
        await set(rtdbRef, subscriberData);
      } catch (rtdbErr) {
        console.warn('[FCM] RTDB subscriber write fallback:', rtdbErr);
      }

      // Play soothing chime confirmation
      playChimeAudio();

      // Show welcome test notification
      this.displayLocalNotification({
        title: '✨ Welcome to Diyas N Duas!',
        body: 'You will now receive instant order updates and sacred festive offers even when screen is locked.',
        icon: '/logo.png',
        tag: 'welcome-notification',
      });

      return { success: true, token: fcmToken };
    } catch (err: any) {
      console.error('[FCM Permission Error]', err);
      return { success: false, error: err.message || 'Failed to initialize notifications.' };
    }
  },

  /**
   * Bind customer order to their device FCM token during checkout
   */
  async linkOrderToDeviceToken(orderId: string): Promise<void> {
    const token = localStorage.getItem(LOCAL_FCM_KEY);
    if (!token) return;

    try {
      const tokenRef = doc(db, FCM_TOKENS_COLLECTION, token);
      await setDoc(tokenRef, { associatedOrderId: orderId, lastActive: Date.now() }, { merge: true });
    } catch {
      // ignore
    }

    try {
      const rtdbKey = token.replace(/[.#$[\]]/g, '_');
      const rtdbRef = ref(rtdb, `${RTDB_SUBSCRIBERS_PATH}/${rtdbKey}/associatedOrderId`);
      await set(rtdbRef, orderId);
    } catch {
      // ignore
    }
  },

  /**
   * Register an Admin device (mobile or desktop) to receive instant push alerts
   * whenever a new order is placed by any customer.
   */
  async registerAdminDeviceToken(): Promise<{ success: boolean; token?: string; error?: string }> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Push notifications are not supported on this browser.' };
    }

    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        return { success: false, error: 'Notification permission was denied.' };
      }

      // Ensure service worker is registered
      let registration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
      }

      const messaging = await getMessagingInstance();
      let fcmToken = '';

      if (messaging) {
        try {
          const { getToken } = await import('firebase/messaging');
          const vapidKey = await this.getVapidKey();
          try {
            fcmToken = await getToken(messaging, {
              vapidKey,
              serviceWorkerRegistration: registration,
            });
          } catch (firstErr) {
            console.warn('[Admin FCM] getToken with custom VAPID key failed, retrying without custom key:', firstErr);
            fcmToken = await getToken(messaging, {
              serviceWorkerRegistration: registration,
            });
          }
        } catch (fcmErr) {
          console.warn('[Admin FCM] Both getToken attempts encountered warning:', fcmErr);
        }
      }

      if (!fcmToken) {
        fcmToken = localStorage.getItem(LOCAL_FCM_KEY) || '';
      }

      if (!fcmToken) {
        // Fallback local key for admin
        let existingLocal = localStorage.getItem(LOCAL_FCM_KEY);
        if (!existingLocal) {
          existingLocal = `dnd_admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        fcmToken = existingLocal;
      }

      localStorage.setItem(LOCAL_FCM_KEY, fcmToken);
      localStorage.setItem('dnd_admin_push_registered', 'true');

      const adminData = {
        token: fcmToken,
        role: 'admin',
        isAdmin: true,
        userAgent: navigator.userAgent || 'Unknown',
        registeredAt: Date.now(),
        lastActive: Date.now(),
      };

      // 1. Save to admin_fcm_tokens collection
      try {
        const adminDocRef = doc(db, 'admin_fcm_tokens', fcmToken);
        await setDoc(adminDocRef, adminData, { merge: true });
      } catch (err) {
        console.warn('[Admin FCM] Firestore admin_fcm_tokens fallback:', err);
      }

      // 2. Also register in fcm_tokens collection with isAdmin: true
      try {
        const tokenRef = doc(db, FCM_TOKENS_COLLECTION, fcmToken);
        await setDoc(tokenRef, adminData, { merge: true });
      } catch (err) {
        console.warn('[Admin FCM] Firestore fcm_tokens fallback:', err);
      }

      return { success: true, token: fcmToken };
    } catch (err: any) {
      console.error('[Admin FCM Registration Error]', err);
      return { success: false, error: err.message || 'Failed to register admin device.' };
    }
  },

  /**
   * Display immediate in-app or browser notification with audio chime
   */
  displayLocalNotification(options: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    tag?: string;
    url?: string;
  }) {
    playChimeAudio();

    // 1. Dispatch custom event for immediate in-app toast / alert banner if tab is in foreground
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dnd_inapp_notification', {
          detail: options,
        })
      );
    }

    // 2. Display OS-level system push notification (compatible with Android mobile & Desktop)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notifOptions: any = {
        body: options.body,
        icon: options.icon || '/logo.png',
        badge: '/favicon.svg',
        image: options.image,
        tag: options.tag || 'dnd-alert',
        data: { url: options.url || '/' },
        vibrate: [250, 100, 250, 100, 250],
        requireInteraction: true,
      };

      // ServiceWorkerRegistration.showNotification() is mandatory for Android Mobile Chrome
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            return registration.showNotification(options.title, notifOptions);
          })
          .catch(() => {
            try {
              new Notification(options.title, notifOptions);
            } catch {}
          });
      } else {
        try {
          new Notification(options.title, notifOptions);
        } catch (err) {
          console.warn('[Notification API]', err);
        }
      }
    }
  },

  /**
   * Dispatches automated order status change notification
   */
  async notifyOrderStatusUpdate(orderId: string, status: OrderStatus, note?: string): Promise<void> {
    const statusMessages: Record<OrderStatus, { title: string; body: string }> = {
      pending: {
        title: `🪔 Order Request Received (#${orderId})`,
        body: 'Your order request has been received by Diyas N Duas and is waiting for store confirmation.',
      },
      pre_order_confirmed: {
        title: `✨ Pre-Order Accepted (#${orderId})`,
        body: 'Your pre-order request has been accepted by Diyas N Duas! Artisan crafting has been scheduled.',
      },
      confirmed: {
        title: `✅ Order Confirmed (#${orderId})`,
        body: 'Your order has been verified and confirmed by our store! Handcrafted packaging will begin shortly.',
      },
      processing: {
        title: `📦 Packaging Diyas (#${orderId})`,
        body: 'Your festive clay diyas and sacred items are being safely packed with festive care.',
      },
      ready: {
        title: `🚚 Ready for Transport (#${orderId})`,
        body: 'Your order parcel is ready for transport despatch. Delivery is on the way!',
      },
      delivered: {
        title: `🎉 Order Fulfilled (#${orderId})`,
        body: 'Your order has been successfully delivered! May these sacred diyas brighten your home and prayers.',
      },
      cancelled: {
        title: `❌ Order Update (#${orderId})`,
        body: note ? `Order was cancelled. Note: ${note}` : 'Your order request was cancelled. Stock has been restored.',
      },
      cancel_requested: {
        title: `⚠️ Cancellation Requested (#${orderId})`,
        body: 'Your cancellation request was submitted to the store admin for review.',
      },
    };

    const msg = statusMessages[status] || {
      title: `Order Update (#${orderId})`,
      body: `Status changed to ${status.replace('_', ' ')}.`,
    };

    // 1. Post notification event to RTDB order channel so customer device tracking this order is alerted
    try {
      const eventRef = ref(rtdb, `order_notifications/${orderId}`);
      await set(eventRef, {
        orderId,
        status,
        title: msg.title,
        body: msg.body,
        url: `/order/${orderId}`,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('[FCM Order Alert RTDB]', e);
    }
  },

  /**
   * Admin: Get all registered devices & subscriber count
   */
  async getSubscribers(): Promise<DeviceSubscriber[]> {
    const subscribers: DeviceSubscriber[] = [];
    try {
      const colRef = collection(db, FCM_TOKENS_COLLECTION);
      const snapshot = await getDocs(colRef);
      snapshot.forEach((d) => {
        subscribers.push(d.data() as DeviceSubscriber);
      });
    } catch {
      // Fallback to RTDB
      try {
        const rtdbRef = ref(rtdb, RTDB_SUBSCRIBERS_PATH);
        const snap = await get(rtdbRef);
        if (snap.exists()) {
          const val = snap.val();
          Object.values(val).forEach((s: any) => subscribers.push(s));
        }
      } catch {
        // ignore
      }
    }
    return subscribers;
  },

  /**
   * Admin: Broadcast promotional campaign / announcement push to all subscribers
   */
  async broadcastCampaign(campaign: {
    title: string;
    body: string;
    imageUrl?: string;
    actionUrl?: string;
  }): Promise<{ success: boolean; recipientCount: number }> {
    const subscribers = await this.getSubscribers();
    const recipientCount = subscribers.length;

    const campaignPayload = {
      ...campaign,
      createdAt: Date.now(),
      sentCount: recipientCount,
    };

    // Save campaign broadcast record to Firestore & RTDB
    try {
      const campaignId = `camp_${Date.now()}`;
      await setDoc(doc(db, 'campaigns', campaignId), campaignPayload);
    } catch (err) {
      console.warn('[FCM Campaign Save Warning]', err);
    }

    try {
      const broadcastRef = ref(rtdb, 'broadcast_campaigns/latest');
      await set(broadcastRef, campaignPayload);
    } catch (err) {
      console.warn('[FCM RTDB Broadcast Warning]', err);
    }

    return { success: true, recipientCount };
  },

  /**
   * Listen to realtime foreground pushes for customer (broadcasts and order status updates)
   */
  subscribeToCustomerEvents(
    recentOrderIds: string[],
    onNotification: (data: { title: string; body: string; image?: string; url?: string; tag?: string }) => void
  ): () => void {
    const unsubscribes: Array<() => void> = [];
    const sessionStartTime = Date.now() - 5000;
    const handledEvents = new Set<string>();

    // 1. Listen for broadcast campaigns
    try {
      const broadcastRef = ref(rtdb, 'broadcast_campaigns/latest');
      const unsubscribeBroadcast = onValue(broadcastRef, (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          const eventKey = `camp_${data.createdAt}`;
          if (data.createdAt && data.createdAt > sessionStartTime && !handledEvents.has(eventKey)) {
            handledEvents.add(eventKey);
            onNotification({
              title: data.title || 'Diyas N Duas Announcement',
              body: data.body || 'New sacred festival announcement!',
              image: data.imageUrl,
              url: data.actionUrl || '/products',
              tag: eventKey,
            });
          }
        }
      });
      unsubscribes.push(unsubscribeBroadcast);
    } catch {
      // ignore
    }

    // 2. Listen for order status updates for customer's recent orders
    if (recentOrderIds && recentOrderIds.length > 0) {
      recentOrderIds.forEach((orderId) => {
        try {
          const orderNotifRef = ref(rtdb, `order_notifications/${orderId}`);
          const unsubscribeOrder = onValue(orderNotifRef, (snap) => {
            if (snap.exists()) {
              const data = snap.val();
              const eventKey = `order_${orderId}_${data.status}_${data.timestamp}`;
              if (data.timestamp && data.timestamp > sessionStartTime && !handledEvents.has(eventKey)) {
                handledEvents.add(eventKey);
                onNotification({
                  title: data.title,
                  body: data.body,
                  url: data.url || `/order/${orderId}`,
                  tag: `order-${orderId}-${data.status}`,
                });
              }
            }
          });
          unsubscribes.push(unsubscribeOrder);
        } catch {
          // ignore
        }
      });
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  },

  /**
   * Backward compatible listener
   */
  subscribeToForegroundEvents(onNotification: (data: any) => void): () => void {
    return this.subscribeToCustomerEvents([], onNotification);
  },
};
