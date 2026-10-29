import { slugify } from '../utils/slugify';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product, ProductDraft } from '../types/product';

const PRODUCTS_COLLECTION = 'products';
const PRODUCTS_CACHE_KEY = 'ck_cached_products';

function sanitizeProductPayload(payload: Record<string, any>): Record<string, any> {
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

export const productsService = {
  // Instant SWR: Read locally cached products synchronously (0ms)
  getCachedProducts(onlyActive = true): Product[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return onlyActive ? parsed.filter((p: Product) => p.isActive) : parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[ProductsService] Failed reading cached products:', e);
    }
    return [];
  },

  // Save latest products to persistent local cache safely
  setCachedProducts(products: Product[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage && Array.isArray(products) && products.length > 0) {
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
      }
    } catch (e) {
      // Storage quota or private mode fallback
      console.warn('[ProductsService] Cache storage warning:', e);
    }
  },

  // Instant Realtime Subscription with 0ms SWR initial emission
  subscribeToProducts(onUpdate: (products: Product[]) => void, onlyActive = true): Unsubscribe {
    // 1. Immediately emit cached products to UI in 0 milliseconds!
    const cached = this.getCachedProducts(onlyActive);
    if (cached.length > 0) {
      onUpdate(cached);
    }

    const colRef = collection(db, PRODUCTS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          let prods = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
          
          // Persist all products to local cache
          this.setCachedProducts(prods);

          if (onlyActive) {
            prods = prods.filter((p) => p.isActive);
          }
          prods.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          onUpdate(prods);
        } else {
          // Only emit empty if cache was also empty
          if (cached.length === 0) {
            onUpdate([]);
          }
        }
      },
      (error) => {
        console.warn('[ProductsService] Realtime subscription error:', error);
        if (cached.length > 0) {
          onUpdate(cached);
        } else {
          onUpdate([]);
        }
      }
    );
  },

  async getAllProducts(onlyActive = true): Promise<Product[]> {
    const cached = this.getCachedProducts(onlyActive);
    try {
      const colRef = collection(db, PRODUCTS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        this.setCachedProducts(prods);
        if (onlyActive) {
          prods = prods.filter(p => p.isActive);
        }
        prods.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return prods;
      }
    } catch (error) {
      console.warn('[ProductsService] Firestore fetch error:', error);
    }
    return cached;
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const colRef = collection(db, PRODUCTS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        this.setCachedProducts(prods);
        return prods.filter(p => p.isActive && p.categoryId === categoryId);
      }
    } catch (error) {
      console.warn('[ProductsService] Query by category failed:', error);
    }
    const cached = this.getCachedProducts(true);
    return cached.filter(p => p.categoryId === categoryId);
  },

  async getProductBySlugOrId(identifier: string): Promise<Product | null> {
    if (!identifier) return null;
    const clean = decodeURIComponent(identifier).trim();

    // 1. Try local cache first for 0ms lookup
    const cached = this.getCachedProducts(false);
    const targetSlug = slugify(clean);
    const cachedMatch = cached.find((p) => {
      if (p.id === clean) return true;
      if (p.slug && (p.slug.toLowerCase() === clean.toLowerCase() || slugify(p.slug) === targetSlug)) return true;
      if (slugify(p.name) === targetSlug) return true;
      return false;
    });

    // 2. Try direct document ID lookup in Firestore
    try {
      const direct = await this.getProductById(clean);
      if (direct) return direct;
    } catch (_) {
      // Fallback
    }

    // 3. Lookup across catalog
    try {
      const all = await this.getAllProducts(false);
      const match = all.find((p) => {
        if (p.id === clean) return true;
        if (p.slug && (p.slug.toLowerCase() === clean.toLowerCase() || slugify(p.slug) === targetSlug)) return true;
        if (slugify(p.name) === targetSlug) return true;
        return false;
      });
      if (match) return match;
    } catch (err) {
      console.warn('[ProductsService] Lookup by slug or ID failed:', err);
    }
    return cachedMatch || null;
  },

  async getProductById(id: string): Promise<Product | null> {
    // 0ms Cache lookup first
    const cached = this.getCachedProducts(false);
    const cachedProduct = cached.find(p => p.id === id);

    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Product;
      }
    } catch (error) {
      console.warn('[ProductsService] Fetch product by ID failed:', error);
    }
    return cachedProduct || null;
  },

  async createProduct(draft: ProductDraft): Promise<string> {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const now = Date.now();
    const slug = draft.slug?.trim() || slugify(draft.name);
    const payload = sanitizeProductPayload({
      ...draft,
      slug,
      createdAt: now,
      updatedAt: now,
    });
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  },

  async updateProduct(id: string, updates: Partial<ProductDraft>): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const slug = updates.slug !== undefined
      ? updates.slug.trim()
      : (updates.name ? slugify(updates.name) : undefined);
    const payload = sanitizeProductPayload({
      ...updates,
      ...(slug ? { slug } : {}),
      updatedAt: Date.now(),
    });
    await updateDoc(docRef, payload);
  },

  async deleteProduct(id: string): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async updateInventory(id: string, quantitySold: number): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const currentStock = snapshot.data().stockQuantity || 0;
      const newStock = Math.max(0, currentStock - quantitySold);
      await updateDoc(docRef, {
        stockQuantity: newStock,
        updatedAt: Date.now(),
      });
    }
  }
};
