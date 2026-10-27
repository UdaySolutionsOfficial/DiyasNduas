import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { InsufficientStockModal, StockIssueItem } from '../components/InsufficientStockModal';
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
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Gift
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { settingsService } from '../../services/settings.service';
import { StoreSettings } from '../../types/settings';
import { useDocumentSeo } from '../hooks/useDocumentSeo';

export const Cart: React.FC = () => {
  useDocumentSeo({
    title: 'Your Festive Cart',
    canonicalPath: '/cart',
    noindex: true,
  });

  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getCartSubtotal, 
    getOriginalTotal, 
    getSavingsTotal,
    specialOfferConfig,
    isMilestoneOfferEligible,
    openSpecialOfferModal,
  } = useCart();

  const toast = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [stockIssues, setStockIssues] = useState<StockIssueItem[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const navigate = useNavigate();



  const handleProceedToCheckout = () => {
    const issues: StockIssueItem[] = cartItems
      .filter((item) => !item.isPreOrder && item.product.stockQuantity !== undefined && item.product.stockQuantity > 0 && item.quantity > item.product.stockQuantity)
      .map((item) => ({
        product: item.product,
        requestedQuantity: item.quantity,
        availableStock: Math.max(0, item.product.stockQuantity ?? 0),
      }));

    if (issues.length > 0) {
      setStockIssues(issues);
      setShowStockModal(true);
      return;
    }

    navigate(ROUTES.CUSTOMER.CHECKOUT);
  };

  const handleAdjustStock = () => {
    stockIssues.forEach(({ product, availableStock }) => {
      if (availableStock <= 0) {
        removeFromCart(product.id);
      } else {
        updateQuantity(product.id, availableStock);
      }
    });
    setShowStockModal(false);
    setStockIssues([]);
    toast.success('Cart Updated', 'Quantities adjusted to available stock.');
  };

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

  const hasPreOrderItems = cartItems.some(i => i.isPreOrder || (i.product.stockQuantity !== undefined && i.product.stockQuantity <= 0));

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

      {/* Pre-Order Informational Banner */}
      {hasPreOrderItems && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 border border-purple-500/25 flex items-center gap-3 text-xs text-purple-900 dark:text-purple-200">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 animate-pulse" />
          <span>
            <strong>Pre-Order Notice:</strong> Your cart includes handcrafted pre-order item(s). In-stock items will be reserved immediately, and pre-order items will be handcrafted upon order confirmation.
          </span>
        </div>
      )}

      {isMilestoneOfferEligible && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-2 border-amber-400 dark:border-amber-600 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Gift className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-200">
                🎉 Special Cart Milestone Unlocked!
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Your cart reached ₹{specialOfferConfig.minCartThreshold}+. You qualify for exclusive clearance deals!
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={openSpecialOfferModal}
            className="w-full sm:w-auto !py-2 !px-4 !text-xs !font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            View Offers ({specialOfferConfig.products?.length || 0})
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Line Items List */}
        <div className="lg:col-span-2 space-y-3.5">
          {cartItems.map((item) => {
            const { product, quantity, isPreOrder } = item;
            const discountPercent = formatDiscountPercentage(product.originalPrice, product.sellingPrice);
            const unitPrice = item.isSpecialOffer && item.specialOfferPrice !== undefined
              ? item.specialOfferPrice
              : product.sellingPrice;
            const itemSubtotal = unitPrice * quantity;
            const isItemPreOrder = Boolean(isPreOrder || (product.stockQuantity !== undefined && product.stockQuantity <= 0));

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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {product.name}
                      </h3>
                      {isItemPreOrder && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                          <Sparkles className="w-2.5 h-2.5 text-purple-500 animate-pulse" /> Pre-Order
                        </span>
                      )}
                    </div>
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

                    {/* Pre-Order or Stock Status Notice */}
                    {isItemPreOrder ? (
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 rounded-md">
                        <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-purple-500 animate-pulse" />
                        <span>Pre-Order Item (Crafted upon request)</span>
                      </div>
                    ) : (
                      <>
                        {product.stockQuantity !== undefined && quantity > product.stockQuantity && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-md animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Only {product.stockQuantity} left in stock. Please adjust quantity.</span>
                          </div>
                        )}

                        {product.stockQuantity !== undefined && quantity === product.stockQuantity && product.stockQuantity <= 5 && (
                          <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                            <span>Only {product.stockQuantity} available in stock</span>
                          </p>
                        )}
                      </>
                    )}
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
                      onClick={() => {
                        if (!isItemPreOrder && product.stockQuantity !== undefined && quantity >= product.stockQuantity) {
                          toast.warning(
                            'Limited Stock Available',
                            `Only ${product.stockQuantity} piece${product.stockQuantity === 1 ? '' : 's'} available in stock for "${product.name}".`
                          );
                          return;
                        }
                        updateQuantity(product.id, quantity + 1);
                      }}
                      className={`w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-xs transition-colors ${
                        !isItemPreOrder && product.stockQuantity !== undefined && product.stockQuantity > 0 && quantity >= product.stockQuantity
                          ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                      }`}
                      aria-label="Increase quantity"
                      title="Increase quantity"
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
            <Button
              onClick={handleProceedToCheckout}
              size="lg"
              className="w-full font-extrabold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 py-3.5"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>No online payment required. Our team will verify your order request via phone/WhatsApp before despatch.</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Insufficient Stock Friendly Vector Alert Modal */}
      <InsufficientStockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        stockIssues={stockIssues}
        onAdjustStock={handleAdjustStock}
        actionText="Adjust to Available Stock"
      />



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
