import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Banner, BannerDraft } from '../types/banner';

const BANNERS_COLLECTION = 'banners';
const BANNERS_CACHE_KEY = 'ck_cached_banners';

function sanitizeBannerPayload(payload: Record<string, any>): Record<string, any> {
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

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'diyas-n-duas-festive-hero',
    title: 'Festive Diyas & Sacred Light',
    subtitle: 'Handcrafted Brass Lamps, Akhand Diyas & Festive Duas for Every Home',
    imageUrl: '/pwa_install_banner.jpg',
    buttonUrl: '/products',
    buttonText: 'EXPLORE SACRED COLLECTION',
    isActive: true,
    displayOrder: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const bannersService = {
  getCachedBanners(): Banner[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem(BANNERS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('[BannersService] Failed reading cached banners:', e);
    }
    return DEFAULT_BANNERS;
  },

  async getActiveBanners(): Promise<Banner[]> {
    try {
      const colRef = collection(db, BANNERS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
        banners = banners.filter(b => b.isActive);
        banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        if (banners.length > 0) {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(BANNERS_CACHE_KEY, JSON.stringify(banners));
            }
          } catch (_) {}
          return banners;
        }
      }
    } catch (error) {
      console.warn('[BannersService] Firestore request failed:', error);
    }
    return this.getCachedBanners();
  },

  async getAllBanners(): Promise<Banner[]> {
    try {
      const colRef = collection(db, BANNERS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
        banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        if (banners.length > 0) return banners;
      }
    } catch (error) {
      console.warn('[BannersService] Failed to fetch all banners:', error);
    }
    return this.getCachedBanners();
  },

  async createBanner(draft: BannerDraft): Promise<string> {
    const colRef = collection(db, BANNERS_COLLECTION);
    const now = Date.now();
    const payload = sanitizeBannerPayload({
      ...draft,
      createdAt: now,
      updatedAt: now,
    });
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  },

  async updateBanner(id: string, updates: Partial<BannerDraft>): Promise<void> {
    const docRef = doc(db, BANNERS_COLLECTION, id);
    const payload = sanitizeBannerPayload({
      ...updates,
      updatedAt: Date.now(),
    });
    await updateDoc(docRef, payload);
  },

  async deleteBanner(id: string): Promise<void> {
    const docRef = doc(db, BANNERS_COLLECTION, id);
    await deleteDoc(docRef);
  }
};
