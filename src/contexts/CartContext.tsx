import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Product } from '../types/product';
import { localStorageUtil, CartItem } from '../utils/localStorage';
import { useToast } from './ToastContext';
import { specialOffersService } from '../services/specialOffers.service';
import { SpecialOfferConfig } from '../types/specialOffer';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, isPreOrder?: boolean) => void;
  addSpecialOfferToCart: (product: Product, offerPrice: number) => void;
  getRegularSubtotal: () => number;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartSubtotal: () => number;
  getOriginalTotal: () => number;
  getSavingsTotal: () => number;
  isProductInCart: (productId: string) => boolean;
  // Special Milestone Offer additions
  specialOfferConfig: SpecialOfferConfig;
  isMilestoneOfferEligible: boolean;
  hasClaimedSpecialOffer: boolean;
  isSpecialOfferModalOpen: boolean;
  openSpecialOfferModal: () => void;
  closeSpecialOfferModal: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => localStorageUtil.getCartItems());
  const [specialOfferConfig, setSpecialOfferConfig] = useState<SpecialOfferConfig>(() =>
    specialOffersService.getCachedSpecialOffers()
  );
  const [isSpecialOfferModalOpen, setIsSpecialOfferModalOpen] = useState(false);
  const toast = useToast();
  const lastTriggeredThreshold = useRef<number | null>(null);

  // Synchronize cart state to LocalStorage
  useEffect(() => {
    localStorageUtil.setCartItems(cartItems);
  }, [cartItems]);

  // Subscribe to real-time special offers configuration
  useEffect(() => {
    const unsubscribe = specialOffersService.subscribeToSpecialOffers((config) => {
      setSpecialOfferConfig(config);
    });
    return () => unsubscribe();
  }, []);

  // Add special milestone offer item to cart with discounted price lock
  const addSpecialOfferToCart = useCallback((product: Product, offerPrice: number) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isSpecialOffer: true,
          specialOfferPrice: offerPrice,
          quantity: Math.max(1, updated[existingIndex].quantity),
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            product,
            quantity: 1,
            addedAt: Date.now(),
            isSpecialOffer: true,
            specialOfferPrice: offerPrice,
          },
        ];
      }
    });

    toast.success(
      'Special Offer Added! 🎉',
      `"${product.name}" added at the special unlocked rate of ₹${offerPrice}!`
    );
  }, [toast]);

  // Add to cart with duplicate prevention (increments quantity if already exists)
  const addToCart = useCallback((product: Product, quantityToAdd = 1, isPreOrder = false) => {
    const isOutOfStock = product.stockQuantity <= 0;
    if (isOutOfStock && !product.allowPreOrder) {
      toast.warning('Out of Stock', `"${product.name}" is out of stock. Please click "I'm Interested" to inquire via WhatsApp.`);
      return;
    }
    const effectivePreOrder = isPreOrder || (isOutOfStock && Boolean(product.allowPreOrder));

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantityToAdd;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          isPreOrder: effectivePreOrder,
          product,
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            product,
            quantity: quantityToAdd,
            addedAt: Date.now(),
            isPreOrder: effectivePreOrder,
          },
        ];
      }
    });

    if (effectivePreOrder) {
      toast.success(
        'Pre-Order Added to Cart',
        `${quantityToAdd}× "${product.name}" added as a Pre-Order request.`
      );
    } else {
      toast.success(
        'Added to Cart',
        `${quantityToAdd}× "${product.name}" added to your cart.`
      );
    }
  }, [toast]);

  // Update item quantity
  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prevItems) => {
      const itemToRemove = prevItems.find((i) => i.product.id === productId);
      if (itemToRemove) {
        toast.info('Item Removed', `"${itemToRemove.product.name}" removed from cart.`);
      }
      return prevItems.filter((i) => i.product.id !== productId);
    });
  }, [toast]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorageUtil.clearCart();
    toast.info('Cart Cleared', 'All items have been removed from your cart.');
  }, [toast]);

  // Calculation helpers
  const getCartCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const getCartSubtotal = useCallback(() => {
    return cartItems.reduce((sum, item) => {
      const unitPrice = item.isSpecialOffer && item.specialOfferPrice !== undefined
        ? item.specialOfferPrice
        : item.product.sellingPrice;
      return sum + unitPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  const getRegularSubtotal = useCallback(() => {
    return cartItems.reduce((sum, item) => {
      if (item.isSpecialOffer) return sum;
      return sum + item.product.sellingPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  const getOriginalTotal = useCallback(() => {
    return cartItems.reduce(
      (sum, item) => sum + (item.product.originalPrice || item.product.sellingPrice) * item.quantity,
      0
    );
  }, [cartItems]);

  const getSavingsTotal = useCallback(() => {
    const original = getOriginalTotal();
    const subtotal = getCartSubtotal();
    return Math.max(0, original - subtotal);
  }, [getOriginalTotal, getCartSubtotal]);

  const isProductInCart = useCallback((productId: string) => {
    return cartItems.some((i) => i.product.id === productId);
  }, [cartItems]);

  // Special Offer Milestone Evaluation
  const regularSubtotal = getRegularSubtotal();
  const isMilestoneOfferEligible = Boolean(
    specialOfferConfig.enabled &&
    specialOfferConfig.products &&
    specialOfferConfig.products.length > 0 &&
    regularSubtotal >= (Number(specialOfferConfig.minCartThreshold) || 700)
  );

  const hasClaimedSpecialOffer = cartItems.some((item) => item.isSpecialOffer);

  // Auto-trigger celebratory popup when threshold is reached
  useEffect(() => {
    if (isMilestoneOfferEligible && !hasClaimedSpecialOffer) {
      const threshold = Number(specialOfferConfig.minCartThreshold) || 700;
      const sessionKey = `ck_milestone_shown_${threshold}`;
      const wasShownInSession = sessionStorage.getItem(sessionKey);

      if (!wasShownInSession && lastTriggeredThreshold.current !== threshold) {
        lastTriggeredThreshold.current = threshold;
        const timer = setTimeout(() => {
          setIsSpecialOfferModalOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isMilestoneOfferEligible, hasClaimedSpecialOffer, specialOfferConfig.minCartThreshold]);

  const openSpecialOfferModal = useCallback(() => {
    setIsSpecialOfferModalOpen(true);
  }, []);

  const closeSpecialOfferModal = useCallback(() => {
    const threshold = Number(specialOfferConfig.minCartThreshold) || 700;
    sessionStorage.setItem(`ck_milestone_shown_${threshold}`, 'true');
    setIsSpecialOfferModalOpen(false);
  }, [specialOfferConfig.minCartThreshold]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        addSpecialOfferToCart,
        getRegularSubtotal,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartCount,
        getCartSubtotal,
        getOriginalTotal,
        getSavingsTotal,
        isProductInCart,
        specialOfferConfig,
        isMilestoneOfferEligible,
        hasClaimedSpecialOffer,
        isSpecialOfferModalOpen,
        openSpecialOfferModal,
        closeSpecialOfferModal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
