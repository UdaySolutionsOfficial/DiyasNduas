import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Product } from '../types/product';
import { localStorageUtil } from '../utils/localStorage';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlistItems: Product[];
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>(() => localStorageUtil.getWishlistItems());
  const toast = useToast();

  useEffect(() => {
    localStorageUtil.setWishlistItems(wishlistItems);
  }, [wishlistItems]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlistItems.some((item) => item.id === productId);
    },
    [wishlistItems]
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      const exists = isInWishlist(product.id);
      if (exists) {
        setWishlistItems((prev) => prev.filter((i) => i.id !== product.id));
        toast.info('Removed from Favorites', `"${product.name}" removed from your wishlist.`);
      } else {
        setWishlistItems((prev) => [product, ...prev]);
        toast.success('Saved to Favorites', `"${product.name}" added to your wishlist.`);
      }
    },
    [isInWishlist, toast]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setWishlistItems((prev) => {
        const item = prev.find((i) => i.id === productId);
        if (item) {
          toast.info('Removed from Favorites', `"${item.name}" removed from your wishlist.`);
        }
        return prev.filter((i) => i.id !== productId);
      });
    },
    [toast]
  );

  const getWishlistCount = useCallback(() => {
    return wishlistItems.length;
  }, [wishlistItems]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        getWishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
