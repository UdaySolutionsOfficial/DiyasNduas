import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Product } from '../types/product';
import { localStorageUtil, CartItem } from '../utils/localStorage';
import { useToast } from './ToastContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartSubtotal: () => number;
  getOriginalTotal: () => number;
  getSavingsTotal: () => number;
  isProductInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => localStorageUtil.getCartItems());
  const toast = useToast();

  // Synchronize cart state to LocalStorage
  useEffect(() => {
    localStorageUtil.setCartItems(cartItems);
  }, [cartItems]);

  // Add to cart with duplicate prevention (increments quantity if already exists)
  const addToCart = useCallback((product: Product, quantityToAdd = 1) => {
    if (product.stockQuantity <= 0) {
      toast.warning('Product Out of Stock', `"${product.name}" is currently unavailable.`);
      return;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantityToAdd;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          // Update snapshot in case price changed
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
          },
        ];
      }
    });

    toast.success(
      'Added to Cart',
      `${quantityToAdd}× "${product.name}" added to your cart.`
    );
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
    return cartItems.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
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

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartCount,
        getCartSubtotal,
        getOriginalTotal,
        getSavingsTotal,
        isProductInCart,
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
