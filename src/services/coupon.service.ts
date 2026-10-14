import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Coupon, CouponValidationResult } from '../types/coupon';

const COUPONS_COLLECTION = 'coupons';
const LOCAL_STORAGE_COUPONS_KEY = 'ck_coupons_cache';

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'DIWALI10',
    code: 'DIWALI10',
    description: 'Festive 10% discount on all handcrafted diyas',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 500,
    maxDiscount: 250,
    isActive: true,
    expiresAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'FLAT100',
    code: 'FLAT100',
    description: 'Flat ₹100 instant cash discount on orders above ₹1,200',
    discountType: 'fixed',
    discountValue: 100,
    minOrderValue: 1200,
    isActive: true,
    expiresAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'FESTIVE50',
    code: 'FESTIVE50',
    description: 'Flat ₹50 savings on any festive order',
    discountType: 'fixed',
    discountValue: 50,
    minOrderValue: 300,
    isActive: true,
    expiresAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Helper to get local cache
function getLocalCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_COUPONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CouponService] Read local storage failed:', err);
  }
  return DEFAULT_COUPONS;
}

// Helper to save local cache
function saveLocalCoupons(coupons: Coupon[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(coupons));
    // Dispatch local storage custom event for cross-component realtime sync
    window.dispatchEvent(new CustomEvent('coupons_updated', { detail: coupons }));
  } catch (err) {
    console.warn('[CouponService] Write local storage failed:', err);
  }
}

export const couponService = {
  /**
   * Realtime subscription to all coupons (with resilient localStorage fallback)
   */
  subscribeToCoupons(callback: (coupons: Coupon[]) => void): Unsubscribe {
    // Deliver local cache first immediately
    callback(getLocalCoupons());

    const handleCustomEvent = (e: any) => {
      if (e.detail) callback(e.detail);
    };
    window.addEventListener('coupons_updated', handleCustomEvent);

    try {
      const colRef = collection(db, COUPONS_COLLECTION);
      const unsubFirestore = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) {
            callback(getLocalCoupons());
            return;
          }
          const coupons: Coupon[] = [];
          snapshot.forEach((docSnap) => {
            coupons.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
          });
          coupons.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          saveLocalCoupons(coupons);
          callback(coupons);
        },
        (error) => {
          // Graceful fallback to persistent cache when Firestore rules block collection
          console.info('[CouponService] Using local persistent coupons storage:', error.message);
          callback(getLocalCoupons());
        }
      );

      return () => {
        window.removeEventListener('coupons_updated', handleCustomEvent);
        unsubFirestore();
      };
    } catch (err) {
      console.info('[CouponService] Firestore unavailable, using local persistent storage');
      return () => {
        window.removeEventListener('coupons_updated', handleCustomEvent);
      };
    }
  },

  /**
   * Fetch all coupons once
   */
  async getAllCoupons(): Promise<Coupon[]> {
    try {
      const colRef = collection(db, COUPONS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const coupons: Coupon[] = [];
        snapshot.forEach((docSnap) => {
          coupons.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
        });
        coupons.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        saveLocalCoupons(coupons);
        return coupons;
      }
    } catch (err) {
      // Fallback
    }
    return getLocalCoupons();
  },

  /**
   * Fetch a single coupon by code
   */
  async getCouponByCode(code: string): Promise<Coupon | null> {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return null;

    try {
      const docRef = doc(db, COUPONS_COLLECTION, normalizedCode);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Coupon;
      }
    } catch (err) {
      // Fallback to local storage
    }

    const localList = getLocalCoupons();
    const found = localList.find((c) => c.code === normalizedCode || c.id === normalizedCode);
    return found || null;
  },

  /**
   * Validate a coupon code dynamically against a subtotal
   */
  async validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      return { isValid: false, discountAmount: 0, message: 'Please enter a coupon code.' };
    }

    const coupon = await this.getCouponByCode(normalizedCode);
    if (!coupon) {
      return { isValid: false, discountAmount: 0, message: `Coupon code "${normalizedCode}" is invalid.` };
    }

    if (!coupon.isActive) {
      return { isValid: false, discountAmount: 0, message: `Coupon code "${coupon.code}" is currently deactivated.` };
    }

    if (coupon.expiresAt && coupon.expiresAt < Date.now()) {
      const expiryDate = new Date(coupon.expiresAt).toLocaleDateString();
      return { isValid: false, discountAmount: 0, message: `Coupon code "${coupon.code}" expired on ${expiryDate}.` };
    }

    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return { 
        isValid: false, 
        discountAmount: 0, 
        message: `Coupon "${coupon.code}" requires minimum cart value of ₹${coupon.minOrderValue.toLocaleString('en-IN')}.` 
      };
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      // Fixed amount discount
      discount = Math.min(coupon.discountValue, subtotal);
    }

    discount = Math.round(discount);

    return {
      isValid: true,
      coupon,
      discountAmount: discount,
      message: `Coupon "${coupon.code}" applied! You save ₹${discount.toLocaleString('en-IN')}.`,
    };
  },

  /**
   * Save / Upsert a coupon (admin)
   */
  async saveCoupon(couponData: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
    const code = couponData.code.trim().toUpperCase();
    if (!code) throw new Error('Coupon code cannot be empty.');

    const docId = code;
    const now = Date.now();

    const existingCoupons = getLocalCoupons();
    const existingIndex = existingCoupons.findIndex((c) => c.id === docId || c.code === code);

    const payload: Coupon = {
      id: docId,
      code,
      description: couponData.description?.trim() || '',
      discountType: couponData.discountType,
      discountValue: Number(couponData.discountValue),
      minOrderValue: couponData.minOrderValue ? Number(couponData.minOrderValue) : 0,
      maxDiscount: couponData.maxDiscount ? Number(couponData.maxDiscount) : undefined,
      isActive: Boolean(couponData.isActive),
      expiresAt: couponData.expiresAt || null,
      createdAt: existingIndex >= 0 ? existingCoupons[existingIndex].createdAt : now,
      updatedAt: now,
    };

    // 1. Update persistent local storage first
    if (existingIndex >= 0) {
      existingCoupons[existingIndex] = payload;
    } else {
      existingCoupons.unshift(payload);
    }
    saveLocalCoupons(existingCoupons);

    // 2. Try Firestore replication in background
    try {
      const docRef = doc(db, COUPONS_COLLECTION, docId);
      const cleanPayload: Record<string, any> = {};
      Object.keys(payload).forEach((k) => {
        const val = (payload as any)[k];
        if (val !== undefined) cleanPayload[k] = val;
      });
      await setDoc(docRef, cleanPayload, { merge: true });
    } catch (fireErr) {
      console.warn('[CouponService] Firestore save sync skipped, cached locally:', fireErr);
    }

    return docId;
  },

  /**
   * Toggle coupon active state
   */
  async toggleCouponActive(id: string, isActive: boolean): Promise<void> {
    // 1. Update persistent local storage first
    const existingCoupons = getLocalCoupons();
    const target = existingCoupons.find((c) => c.id === id || c.code === id);
    if (target) {
      target.isActive = isActive;
      target.updatedAt = Date.now();
      saveLocalCoupons(existingCoupons);
    }

    // 2. Try Firestore
    try {
      const docRef = doc(db, COUPONS_COLLECTION, id);
      await setDoc(docRef, { isActive, updatedAt: Date.now() }, { merge: true });
    } catch (fireErr) {
      console.warn('[CouponService] Firestore toggle sync skipped, updated locally:', fireErr);
    }
  },

  /**
   * Delete coupon permanently
   */
  async deleteCoupon(id: string): Promise<void> {
    // 1. Update local storage
    const existingCoupons = getLocalCoupons().filter((c) => c.id !== id && c.code !== id);
    saveLocalCoupons(existingCoupons);

    // 2. Try Firestore
    try {
      const docRef = doc(db, COUPONS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (fireErr) {
      console.warn('[CouponService] Firestore delete sync skipped, removed locally:', fireErr);
    }
  },
};
