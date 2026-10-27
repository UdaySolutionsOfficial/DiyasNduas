import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';
import { StoreSettings } from '../types/settings';

const SETTINGS_DOC_PATH = 'settings/store_config';
const LOCAL_STORAGE_SETTINGS_KEY = 'ck_store_settings_cache';

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Diyas N Duas',
  logoUrl: '',
  contactPhone: '+91 9177536399',
  whatsappNumber: '+91 9177536399',
  storeEmail: 'udaysolutions.us@gmail.com',
  instagramUrl: 'https://instagram.com/diyasnduas',
  storeAddress: 'Boraband Hyd',
  businessHours: 'Mon - Sun: 9:00 AM - 9:00 PM',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d237.88628099032428!2d78.40962557790971!3d17.451073009805704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1791916843800!5m2!1sen!2sin',
  mapDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=17.451073,78.409626',
  minOrderValue: 0,
  freeDeliveryThreshold: 1000,
  defaultDeliveryFee: 80,
  noticeBannerText: 'Welcome to Diyas N Duas! Free Delivery on orders of ₹1,000 & above.',
  isStoreOpen: true,
  acceptingOrders: true,
  featuredSectionTitle: 'Featured Festive Collections',
  checkoutInstructions: 'Please review your customer details and item quantities carefully before submitting your order request.',
  orderConfirmationNote: 'Our team will contact you shortly on WhatsApp or phone to confirm your order and delivery details.',
  taxSettings: {
    enabled: false,
    name: 'GST',
    rate: 5,
  },
  updatedAt: Date.now(),
};

function getLocalSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    }
  } catch (err) {
    console.warn('[SettingsService] Read local cache failed:', err);
  }
  return DEFAULT_SETTINGS;
}

function saveLocalSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('ck_store_settings_updated', { detail: settings }));
  } catch (err) {
    console.warn('[SettingsService] Write local cache failed:', err);
  }
}

function sanitizeSettingsPayload(payload: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(payload).forEach((key) => {
    const val = payload[key];
    if (val !== undefined) {
      clean[key] = val;
    } else {
      clean[key] = '';
    }
  });
  return clean;
}

export const settingsService = {
  /**
   * Synchronous accessor for instantly available cached store settings (0ms latency, zero flicker)
   */
  getCachedSettings(): StoreSettings {
    return getLocalSettings();
  },

  async getStoreSettings(): Promise<StoreSettings> {
    try {
      const docRef = doc(db, SETTINGS_DOC_PATH);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = { ...DEFAULT_SETTINGS, ...snapshot.data() } as StoreSettings;
        saveLocalSettings(data);
        return data;
      }
    } catch (error) {
      console.warn('[SettingsService] Failed to fetch settings, using cache/defaults:', error);
    }
    return getLocalSettings();
  },

  subscribeToStoreSettings(callback: (settings: StoreSettings) => void): Unsubscribe {
    // Deliver synchronous cached settings immediately on frame 0
    callback(getLocalSettings());

    const docRef = doc(db, SETTINGS_DOC_PATH);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { ...DEFAULT_SETTINGS, ...snapshot.data() } as StoreSettings;
          saveLocalSettings(data);
          callback(data);
        } else {
          callback(DEFAULT_SETTINGS);
        }
      },
      (error) => {
        console.warn('[SettingsService] Snapshot listener error, using cache/defaults:', error);
        callback(getLocalSettings());
      }
    );
  },

  async updateStoreSettings(updates: Partial<StoreSettings>): Promise<void> {
    const current = getLocalSettings();
    const updated = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };
    saveLocalSettings(updated);

    const docRef = doc(db, SETTINGS_DOC_PATH);
    const payload = sanitizeSettingsPayload({
      ...updates,
      updatedAt: Date.now(),
    });
    await setDoc(docRef, payload, { merge: true });
  }
};
