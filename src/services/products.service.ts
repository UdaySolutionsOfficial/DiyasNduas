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
  subscribeToProducts(onUpdate: (products: Product[]) => void, onlyActive = true): Unsubscribe {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          let prods = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
          if (onlyActive) {
            prods = prods.filter((p) => p.isActive);
          }
          prods.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          onUpdate(prods);
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        console.warn('[ProductsService] Realtime subscription error:', error);
        onUpdate([]);
      }
    );
  },

  async getAllProducts(onlyActive = true): Promise<Product[]> {
    try {
      const colRef = collection(db, PRODUCTS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        if (onlyActive) {
          prods = prods.filter(p => p.isActive);
        }
        prods.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return prods;
      }
    } catch (error) {
      console.warn('[ProductsService] Firestore fetch error:', error);
    }
    return [];
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const colRef = collection(db, PRODUCTS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        return prods.filter(p => p.isActive && p.categoryId === categoryId);
      }
    } catch (error) {
      console.warn('[ProductsService] Query by category failed:', error);
    }
    return [];
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Product;
      }
    } catch (error) {
      console.warn('[ProductsService] Fetch product by ID failed:', error);
    }
    return null;
  },

  async createProduct(draft: ProductDraft): Promise<string> {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const now = Date.now();
    const payload = sanitizeProductPayload({
      ...draft,
      createdAt: now,
      updatedAt: now,
    });
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  },

  async updateProduct(id: string, updates: Partial<ProductDraft>): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const payload = sanitizeProductPayload({
      ...updates,
      updatedAt: Date.now(),
    });
    await updateDoc(docRef, payload);
  },

  async deleteProduct(id: string): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  }
};
