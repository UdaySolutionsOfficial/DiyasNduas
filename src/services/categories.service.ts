import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Category, CategoryDraft } from '../types/category';

const CATEGORIES_COLLECTION = 'categories';

export const categoriesService = {
  async getAllCategories(onlyActive = true): Promise<Category[]> {
    try {
      const colRef = collection(db, CATEGORIES_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        if (onlyActive) {
          cats = cats.filter(c => c.isActive);
        }
        cats.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return cats;
      }
    } catch (error) {
      console.warn('[CategoriesService] Firestore fetch failed:', error);
    }
    return [];
  },

  async createCategory(draft: CategoryDraft): Promise<string> {
    const colRef = collection(db, CATEGORIES_COLLECTION);
    const now = Date.now();
    const docRef = await addDoc(colRef, {
      ...draft,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async updateCategory(id: string, updates: Partial<CategoryDraft>): Promise<void> {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(docRef);
  }
};
