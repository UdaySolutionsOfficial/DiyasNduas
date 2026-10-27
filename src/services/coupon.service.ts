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
import { ref, set, get, remove, onValue } from 'firebase/database';
import { db, rtdb } from '../firebase/config';
import { Coupon, CouponValidationResult } from '../types/coupon';

const COUPONS_COLLECTION = 'coupons';
const RTDB_COUPONS_PATH = 'coupons';
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
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
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
    createdAt: Date.now() - 90000,
    updatedAt: Date.now() - 90000,
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
    createdAt: Date.now() - 80000,
    updatedAt: Date.now() - 80000,
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
    // Dispatch local custom event for cross-component realtime sync
    window.dispatchEvent(new CustomEvent('coupons_updated', { detail: coupons }));
  } catch (err) {
    console.warn('[CouponService] Write local storage failed:', err);
  }
}

// Clean payload for Firebase writes (remove undefined)
function sanitizeCoupon(coupon: Coupon): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(coupon).forEach((k) => {
    const val = (coupon as any)[k];
    if (val !== undefined) clean[k] = val;
  });
  return clean;
}

export const couponService = {
  /**
   * Realtime dual-sync subscription to all coupons (Firestore + Realtime Database)
   */
  subscribeToCoupons(callback: (coupons: Coupon[]) => void): Unsubscribe {
    // Deliver local cache immediately for instant UI render
    const cached = getLocalCoupons();
    callback(cached);

    // Auto-replicate any local coupons to Cloud Firestore & RTDB if not yet synced
    if (cached.length > 0) {
      setTimeout(() => {
        cached.forEach(async (c) => {
          try {
            const clean = sanitizeCoupon(c);
            const docRef = doc(db, COUPONS_COLLECTION, c.code);
            await setDoc(docRef, clean, { merge: true });
            const rtdbRef = ref(rtdb, `${RTDB_COUPONS_PATH}/${c.code}`);
            await set(rtdbRef, clean);
          } catch (e) {
            // Background sync
          }
        });
      }, 500);
    }

    const handleCustomEvent = (e: any) => {
      if (e.detail) callback(e.detail);
    };
    window.addEventListener('coupons_updated', handleCustomEvent);

    let isSubscribed = true;

    // Helper to merge and sort coupon lists
    const processCouponList = (list: Coupon[]) => {
      if (!isSubscribed || list.length === 0) return;
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      saveLocalCoupons(list);
      callback(list);
    };

    // 1. Subscribe to Cloud Firestore
    let unsubFirestore: (() => void) | null = null;
    try {
      const colRef = collection(db, COUPONS_COLLECTION);
      unsubFirestore = onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Coupon[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
            });
            processCouponList(list);
          } else {
            // Firestore collection is empty, trigger seed of defaults
            this.seedDefaultCoupons();
          }
        },
        (error) => {
          console.warn('[CouponService] Firestore realtime listener info:', error.message);
        }
      );
    } catch (err) {
      console.warn('[CouponService] Firestore listener init failed:', err);
    }

    // 2. Subscribe to Firebase Realtime Database for instant multi-device sync
    let unsubRtdb: (() => void) | null = null;
    try {
      const rtdbCouponsRef = ref(rtdb, RTDB_COUPONS_PATH);
      unsubRtdb = onValue(
        rtdbCouponsRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.val();
            const list: Coupon[] = Object.keys(data).map((k) => ({
              id: k,
              ...data[k],
            }));
            processCouponList(list);
          }
        },
        (err) => {
          console.warn('[CouponService] RTDB realtime listener info:', err.message);
        }
      );
    } catch (err) {
      console.warn('[CouponService] RTDB listener init failed:', err);
    }

    return () => {
      isSubscribed = false;
      window.removeEventListener('coupons_updated', handleCustomEvent);
      if (unsubFirestore) unsubFirestore();
      if (unsubRtdb) unsubRtdb();
    };
  },

  /**
   * Seed default coupons to cloud if empty
   */
  async seedDefaultCoupons(): Promise<void> {
    try {
      for (const def of DEFAULT_COUPONS) {
        const clean = sanitizeCoupon(def);
        // Firestore
        const docRef = doc(db, COUPONS_COLLECTION, def.id);
        await setDoc(docRef, clean, { merge: true });
        // RTDB
        const rtdbRef = ref(rtdb, `${RTDB_COUPONS_PATH}/${def.id}`);
        await set(rtdbRef, clean);
      }
    } catch (err) {
      console.info('[CouponService] Seed skipped:', err);
    }
  },

  /**
   * Fetch all coupons once
   */
  async getAllCoupons(): Promise<Coupon[]> {
    // 1. Try Firestore
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
      console.warn('[CouponService] Firestore getDocs failed:', err);
    }

    // 2. Try RTDB
    try {
      const rtdbCouponsRef = ref(rtdb, RTDB_COUPONS_PATH);
      const rtdbSnap = await get(rtdbCouponsRef);
      if (rtdbSnap.exists()) {
        const data = rtdbSnap.val();
        const list: Coupon[] = Object.keys(data).map((k) => ({
          id: k,
          ...data[k],
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        saveLocalCoupons(list);
        return list;
      }
    } catch (err) {
      console.warn('[CouponService] RTDB get failed:', err);
    }

    return getLocalCoupons();
  },

  /**
   * Fetch a single coupon by code (from Firestore -> RTDB -> Cache)
   */
  async getCouponByCode(code: string): Promise<Coupon | null> {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return null;

    // 1. Try Firestore direct lookup
    try {
      const docRef = doc(db, COUPONS_COLLECTION, normalizedCode);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const coupon = { id: snap.id, ...snap.data() } as Coupon;
        return coupon;
      }
    } catch (err) {
      console.warn('[CouponService] Firestore getCouponByCode lookup failed:', err);
    }

    // 2. Try RTDB direct lookup
    try {
      const rtdbRef = ref(rtdb, `${RTDB_COUPONS_PATH}/${normalizedCode}`);
      const rtdbSnap = await get(rtdbRef);
      if (rtdbSnap.exists()) {
        const coupon = { id: normalizedCode, ...rtdbSnap.val() } as Coupon;
        return coupon;
      }
    } catch (err) {
      console.warn('[CouponService] RTDB getCouponByCode lookup failed:', err);
    }

    // 3. Fallback to local cache
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
      return { isValid: false, discountAmount: 0, message: 'Please enter a promo code.' };
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
   * Save / Upsert a coupon (admin) — Writes to Firestore, RTDB & LocalStorage
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

    const cleanPayload = sanitizeCoupon(payload);

    // 2. Replicate to Cloud Firestore
    try {
      const docRef = doc(db, COUPONS_COLLECTION, docId);
      await setDoc(docRef, cleanPayload, { merge: true });
    } catch (fireErr: any) {
      console.warn('[CouponService] Firestore save sync error:', fireErr?.message || fireErr);
    }

    // 3. Replicate to Firebase Realtime Database for instant cross-device broadcast
    try {
      const rtdbRef = ref(rtdb, `${RTDB_COUPONS_PATH}/${docId}`);
      await set(rtdbRef, cleanPayload);
    } catch (rtdbErr: any) {
      console.warn('[CouponService] RTDB save sync error:', rtdbErr?.message || rtdbErr);
    }

    return docId;
  },

  /**
   * Toggle coupon active state across Firestore, RTDB & LocalStorage
   */
  async toggleCouponActive(id: string, isActive: boolean): Promise<void> {
    const normalizedId = id.trim().toUpperCase();
    const now = Date.now();

    // 1. Update persistent local storage
    const existingCoupons = getLocalCoupons();
    const target = existingCoupons.find((c) => c.id === normalizedId || c.code === normalizedId);
    if (target) {
      target.isActive = isActive;
      target.updatedAt = now;
      saveLocalCoupons(existingCoupons);
    }

    // 2. Update Cloud Firestore
    try {
      const docRef = doc(db, COUPONS_COLLECTION, normalizedId);
      await setDoc(docRef, { isActive, updatedAt: now }, { merge: true });
    } catch (fireErr) {
      console.warn('[CouponService] Firestore toggle sync error:', fireErr);
    }

    // 3. Update RTDB
    try {
      const rtdbRef = ref(rtdb, `${RTDB_COUPONS_PATH}/${normalizedId}/isActive`);
      await set(rtdbRef, isActive);
      const rtdbUpdateRef = ref(rtdb, `${RTDB_COUPONS_PATH}/${normalizedId}/updatedAt`);
      await set(rtdbUpdateRef, now);
    } catch (rtdbErr) {
      console.warn('[CouponService] RTDB toggle sync error:', rtdbErr);
    }
  },

  /**
   * Delete coupon permanently across Firestore, RTDB & LocalStorage
   */
  async deleteCoupon(id: string): Promise<void> {
    const normalizedId = id.trim().toUpperCase();

    // 1. Update local storage
    const existingCoupons = getLocalCoupons().filter((c) => c.id !== normalizedId && c.code !== normalizedId);
    saveLocalCoupons(existingCoupons);

    // 2. Delete from Cloud Firestore
    try {
      const docRef = doc(db, COUPONS_COLLECTION, normalizedId);
      await deleteDoc(docRef);
    } catch (fireErr) {
      console.warn('[CouponService] Firestore delete sync error:', fireErr);
    }

    // 3. Delete from RTDB
    try {
      const rtdbRef = ref(rtdb, `${RTDB_COUPONS_PATH}/${normalizedId}`);
      await remove(rtdbRef);
    } catch (rtdbErr) {
      console.warn('[CouponService] RTDB delete sync error:', rtdbErr);
    }
  },
};
