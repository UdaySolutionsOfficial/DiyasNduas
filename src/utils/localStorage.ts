import { Product } from '../types/product';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
  isPreOrder?: boolean;
  isSpecialOffer?: boolean;
  specialOfferPrice?: number;
}

export interface RecentOrderReference {
  orderId: string;
  customerName: string;
  totalAmount: number;
  createdAt: number;
}

const KEYS = {
  CART: 'ck_cart_v1',
  WISHLIST: 'ck_wishlist_v1',
  RECENT_ORDERS: 'ck_recent_orders_v1',
  THEME: 'ck_theme_pref',
};

export const localStorageUtil = {
  // --- Cart ---
  getCartItems(): CartItem[] {
    try {
      const raw = localStorage.getItem(KEYS.CART);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && item.product && typeof item.quantity === 'number');
    } catch (e) {
      console.warn('[LocalStorage] Failed to parse cart data, resetting safely:', e);
      return [];
    }
  },

  setCartItems(items: CartItem[]): void {
    try {
      localStorage.setItem(KEYS.CART, JSON.stringify(items));
    } catch (e) {
      console.warn('[LocalStorage] Cart storage save failed:', e);
    }
  },

  clearCart(): void {
    try {
      localStorage.removeItem(KEYS.CART);
    } catch (e) {
      console.warn('[LocalStorage] Clear cart failed:', e);
    }
  },

  // --- Wishlist ---
  getWishlistItems(): Product[] {
    try {
      const raw = localStorage.getItem(KEYS.WISHLIST);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && item.id && item.name);
    } catch (e) {
      console.warn('[LocalStorage] Failed to parse wishlist data, resetting safely:', e);
      return [];
    }
  },

  setWishlistItems(items: Product[]): void {
    try {
      localStorage.setItem(KEYS.WISHLIST, JSON.stringify(items));
    } catch (e) {
      console.warn('[LocalStorage] Wishlist storage save failed:', e);
    }
  },

  // --- Recent Orders ---
  getRecentOrders(): RecentOrderReference[] {
    try {
      const raw = localStorage.getItem(KEYS.RECENT_ORDERS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addRecentOrder(ref: RecentOrderReference): void {
    try {
      const current = this.getRecentOrders();
      const filtered = current.filter(o => o.orderId !== ref.orderId);
      const updated = [ref, ...filtered].slice(0, 10);
      localStorage.setItem(KEYS.RECENT_ORDERS, JSON.stringify(updated));
    } catch (e) {
      console.warn('[LocalStorage] Recent order save failed:', e);
    }
  },

  // --- Theme ---
  getThemePreference(): 'light' | 'dark' {
    try {
      return (localStorage.getItem(KEYS.THEME) as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  },

  setThemePreference(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(KEYS.THEME, theme);
    } catch (e) {
      console.warn('[LocalStorage] Theme save failed:', e);
    }
  }
};
