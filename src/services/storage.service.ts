import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

export const storageService = {
  async uploadProductImage(file: File, productId: string): Promise<string> {
    const fileName = `${productId}_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `products/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  async uploadBannerImage(file: File): Promise<string> {
    const fileName = `banner_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `banners/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  async deleteImageByUrl(url: string): Promise<void> {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn('[StorageService] Delete image failed or URL invalid:', error);
    }
  }
};
