import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SpecialOfferConfig } from '../types/specialOffer';

const SPECIAL_OFFERS_DOC = 'settings/special_offers';
const LOCAL_STORAGE_KEY = 'ck_special_offers_cache';

const DEFAULT_SPECIAL_OFFERS: SpecialOfferConfig = {
  enabled: false,
  minCartThreshold: 700,
  bannerUrl: '',
  title: 'Exclusive Cart Milestone Offer! 🪔✨',
  subtitle: "Congratulations! Because your cart reached our festive threshold, you've unlocked these handcrafted specials at exclusive clearance prices!",
  products: [],
  updatedAt: Date.now(),
};

function getLocalCache(): SpecialOfferConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SPECIAL_OFFERS, ...parsed };
      }
    }
  } catch (err) {
    console.warn('[SpecialOffersService] Read cache error:', err);
  }
  return DEFAULT_SPECIAL_OFFERS;
}

function setLocalCache(config: SpecialOfferConfig): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('[SpecialOffersService] Write cache error:', err);
  }
}

export const specialOffersService = {
  getCachedSpecialOffers(): SpecialOfferConfig {
    return getLocalCache();
  },

  async getSpecialOffersConfig(): Promise<SpecialOfferConfig> {
    try {
      const ref = doc(db, SPECIAL_OFFERS_DOC);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as SpecialOfferConfig;
        const merged = { ...DEFAULT_SPECIAL_OFFERS, ...data };
        setLocalCache(merged);
        return merged;
      }
    } catch (err) {
      console.warn('[SpecialOffersService] Fetch error:', err);
    }
    return getLocalCache();
  },

  subscribeToSpecialOffers(callback: (config: SpecialOfferConfig) => void): Unsubscribe {
    const ref = doc(db, SPECIAL_OFFERS_DOC);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SpecialOfferConfig;
          const merged = { ...DEFAULT_SPECIAL_OFFERS, ...data };
          setLocalCache(merged);
          callback(merged);
        } else {
          callback(DEFAULT_SPECIAL_OFFERS);
        }
      },
      (err) => {
        console.warn('[SpecialOffersService] Snapshot error:', err);
        callback(getLocalCache());
      }
    );
  },

  async updateSpecialOffersConfig(updates: Partial<SpecialOfferConfig>): Promise<void> {
    const current = await this.getSpecialOffersConfig();
    const updated: SpecialOfferConfig = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };
    const ref = doc(db, SPECIAL_OFFERS_DOC);
    await setDoc(ref, updated, { merge: true });
    setLocalCache(updated);
  },
};
