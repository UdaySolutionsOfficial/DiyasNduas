import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDiscountPercentage } from '../../utils/formatters';
import { 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Tag,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { settingsService } from '../../services/settings.service';
import { StoreSettings } from '../../types/settings';

export const Cart: React.FC = () => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getCartSubtotal, 
    getOriginalTotal, 
    getSavingsTotal 
  } = useCart();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    settingsService.getStoreSettings().then(setSettings);
  }, []);

  const cartSubtotal = getCartSubtotal();
  const originalTotal = getOriginalTotal();
  const savingsTotal = getSavingsTotal();

  const freeDeliveryThreshold = settings?.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 1000;
  const standardDeliveryFee = settings?.defaultDeliveryFee !== undefined ? settings.defaultDeliveryFee : 80;
  const isFreeDelivery = cartSubtotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : standardDeliveryFee;
  const estimatedTotal = cartSubtotal + deliveryFee;
  const amountNeeded = Math.max(0, freeDeliveryThreshold - cartSubtotal);
  const progressPercent = Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100);

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-fade-in">
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 text-brand-500" />}
          title="Your Cart is Empty"
          description="Your cart is waiting for something special. Explore our festive collection and add your favorites."
          actionText="START SHOPPING"
          onAction={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your Shopping Cart</h1>
          <p className="text-sm text-slate-500">Review selected festive items before placing order request.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowClearConfirm(true)}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          <span>Clear Cart</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Line Items List */}
        <div className="lg:col-span-2 space-y-3.5">
          {cartItems.map(({ product, quantity }) => {
            const discountPercent = formatDiscountPercentage(product.originalPrice, product.sellingPrice);
            const itemSubtotal = product.sellingPrice * quantity;
            const isOutOfStock = product.stockQuantity <= 0;

            return (
              <Card
                key={product.id}
                glass
                className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-2xl"
              >
                {/* Product Image & Title */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-800">
                    <img
                      src={product.images?.[0] || ''}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    {product.categoryName && (
                      <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest block">
                        {product.categoryName}
                      </span>
                    )}
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(product.sellingPrice)}
                      </span>
                      {product.originalPrice > product.sellingPrice && (
                        <span className="text-slate-400 line-through font-medium">
                          {formatINR(product.originalPrice)}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <span className="text-[10px] font-extrabold text-rose-500">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Selector & Item Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Quantity Control Buttons */}
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-extrabold text-xs text-slate-900 dark:text-slate-100">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      disabled={isOutOfStock}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal & Delete Action */}
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-slate-900 dark:text-slate-100 min-w-[70px] text-right">
                      {formatINR(itemSubtotal)}
                    </span>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Order Bill Summary Card */}
        <div className="space-y-4">
          <Card glass className="p-6 space-y-5 sticky top-24">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-200 dark:border-slate-800">
              Order Request Summary
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Original Price Value</span>
                <span className="font-semibold line-through text-slate-400">{formatINR(originalTotal)}</span>
              </div>

              {savingsTotal > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Festive Discount Savings</span>
                  </span>
                  <span>- {formatINR(savingsTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatINR(cartSubtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Delivery Charges</span>
                </span>
                {isFreeDelivery ? (
                  <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400">
                    <span className="line-through text-[11px] text-slate-400 font-normal">₹{standardDeliveryFee}</span>
                    <span>FREE</span>
                  </span>
                ) : (
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatINR(standardDeliveryFee)}
                  </span>
                )}
              </div>

              {/* Progress to Free Delivery */}
              {!isFreeDelivery ? (
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-200 space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Add {formatINR(amountNeeded)} more for FREE Delivery</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-amber-200 dark:bg-amber-900 overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>FREE Delivery Unlocked on your order!</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">Total</span>
                  <span className="text-[10px] text-slate-400 block">Including delivery</span>
                </div>
                <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                  {formatINR(estimatedTotal)}
                </span>
              </div>
            </div>

            {/* Direct Order Request Trigger */}
            <Link to={ROUTES.CUSTOMER.CHECKOUT} className="block w-full">
              <Button size="lg" className="w-full font-extrabold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 py-3.5">
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>No online payment required. Our team will verify your order request via phone/WhatsApp before despatch.</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearCart();
          setShowClearConfirm(false);
        }}
        title="Clear Shopping Cart"
        message="Are you sure you want to remove all items from your cart?"
        confirmText="Clear Cart"
        isDestructive
      />
    </div>
  );
};
