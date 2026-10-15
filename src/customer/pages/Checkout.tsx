import React, { useEffect, useState, useCallback } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { CheckoutForm } from '../components/CheckoutForm';
import { CheckoutNotificationToggle } from '../components/CheckoutNotificationToggle';
import { WhatsAppTransitionModal } from '../components/WhatsAppTransitionModal';
import { InsufficientStockModal, StockIssueItem } from '../components/InsufficientStockModal';
import { CustomerInfo, Order } from '../../types/order';
import { StoreSettings } from '../../types/settings';
import { Coupon } from '../../types/coupon';
import { ordersService } from '../../services/orders.service';
import { settingsService } from '../../services/settings.service';
import { couponService } from '../../services/coupon.service';
import { fcmService } from '../../services/fcm.service';
import { localStorageUtil } from '../../utils/localStorage';
import { openWhatsAppOrderLink } from '../../utils/whatsapp';
import { formatINR, formatDiscountPercentage } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { 
  ShoppingBag, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Lock, 
  Tag, 
  Truck,
  AlertCircle,
  Info,
  CheckCircle2,
  Sparkles,
  TicketPercent,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useDocumentSeo } from '../hooks/useDocumentSeo';

export const Checkout: React.FC = () => {
  useDocumentSeo({
    title: 'Secure Checkout',
    canonicalPath: '/checkout',
    noindex: true,
  });

  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getCartSubtotal, 
    getOriginalTotal, 
    getSavingsTotal 
  } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Customer Form State
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    phone: '',
    address: '',
    city: 'Diyas N Duas Hub / Local Delivery',
    pincode: '626123',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WhatsApp Transition Modal State
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Insufficient Stock Modal State
  const [stockIssues, setStockIssues] = useState<StockIssueItem[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);

  // Coupon & Promo Code State
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [notificationsActive, setNotificationsActive] = useState(true);
  const handleToggleNotification = useCallback((enabled: boolean) => {
    setNotificationsActive(enabled);
  }, []);

  useEffect(() => {
    settingsService.getStoreSettings().then(setSettings);
  }, []);

  const cartSubtotal = getCartSubtotal();
  const originalTotal = getOriginalTotal();
  const savingsTotal = getSavingsTotal();

  // Delivery Fee Calculation (Orders >= 1000 get Free Delivery, under 1000 pay 80)
  const freeDeliveryThreshold = settings?.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 1000;
  const standardDeliveryFee = settings?.defaultDeliveryFee !== undefined ? settings.defaultDeliveryFee : 80;
  const isFreeDelivery = cartSubtotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : standardDeliveryFee;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartSubtotal);
  const freeDeliveryProgress = Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100);

  // Tax Calculation (Configurable GST / VAT by Admin)
  const taxSettings = settings?.taxSettings;
  const isTaxEnabled = Boolean(taxSettings?.enabled && taxSettings?.rate && taxSettings.rate > 0);
  const taxRate = isTaxEnabled ? Number(taxSettings?.rate) || 0 : 0;
  const taxName = taxSettings?.name || 'GST';

  // Subtotal after coupon discount
  const effectiveSubtotal = Math.max(0, cartSubtotal - couponDiscount);
  const taxAmount = isTaxEnabled ? Math.round((effectiveSubtotal * taxRate) / 100) : 0;
  const grandTotal = effectiveSubtotal + taxAmount + deliveryFee;

  // Intelligent Automatic Coupon Re-Validation on Cart Item Changes / Subtotal Changes
  useEffect(() => {
    if (!appliedCoupon) return;

    // Check if new cartSubtotal still satisfies coupon criteria
    if (appliedCoupon.minOrderValue && cartSubtotal < appliedCoupon.minOrderValue) {
      // Automatic revocation because order value dropped below requirement!
      const revokedCode = appliedCoupon.code;
      const requiredAmount = appliedCoupon.minOrderValue;
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage({
        text: `Coupon "${revokedCode}" was automatically removed because cart value (₹${cartSubtotal.toLocaleString('en-IN')}) is below required ₹${requiredAmount.toLocaleString('en-IN')}.`,
        isError: true,
      });
      toast.warning(
        'Coupon Revoked',
        `Coupon "${revokedCode}" removed: cart subtotal dropped below required minimum of ₹${requiredAmount.toLocaleString('en-IN')}.`
      );
      return;
    }

    // Re-calculate the discount according to new subtotal
    let newDiscount = 0;
    if (appliedCoupon.discountType === 'percentage') {
      newDiscount = (cartSubtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && newDiscount > appliedCoupon.maxDiscount) {
        newDiscount = appliedCoupon.maxDiscount;
      }
    } else {
      newDiscount = Math.min(appliedCoupon.discountValue, cartSubtotal);
    }
    newDiscount = Math.round(newDiscount);

    if (newDiscount !== couponDiscount) {
      setCouponDiscount(newDiscount);
    }
  }, [cartSubtotal, appliedCoupon]);

  // Handle Apply Coupon
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promoCodeInput.trim()) {
      setCouponMessage({ text: 'Please enter a coupon code.', isError: true });
      return;
    }

    try {
      setIsValidatingCoupon(true);
      setCouponMessage(null);
      const res = await couponService.validateCoupon(promoCodeInput, cartSubtotal);
      if (res.isValid && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponDiscount(res.discountAmount);
        setCouponMessage({ text: res.message, isError: false });
        toast.success('Coupon Applied!', res.message);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponMessage({ text: res.message, isError: true });
        toast.warning('Invalid Coupon', res.message);
      }
    } catch (err: any) {
      setCouponMessage({ text: 'Failed to validate coupon code.', isError: true });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setPromoCodeInput('');
    setCouponMessage(null);
    toast.info('Coupon Removed', 'Promo discount has been cleared.');
  };

  if ((!cartItems || cartItems.length === 0) && !pendingOrder) {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-fade-in">
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 text-brand-500" />}
          title="Your Cart is Empty"
          description="Please add items to your cart before proceeding to checkout."
          actionText="BROWSE CATALOG"
          onAction={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
        />
      </div>
    );
  }

  const isOrderingDisabled = Boolean(
    settings && (!settings.acceptingOrders || !settings.isStoreOpen)
  );

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerInfo.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    }

    const cleanPhone = customerInfo.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile phone number.';
    }

    if (!customerInfo.address.trim()) {
      newErrors.address = 'Please enter your delivery / local address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Order Request Call
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isOrderingDisabled) {
      toast.warning('Ordering Disabled', 'Store is temporarily not accepting new order requests.');
      return;
    }

    if (isSubmitting) return;

    if (!validateForm()) {
      toast.warning('Form Validation', 'Please fill in all required contact and delivery fields.');
      return;
    }

    // Pre-validate stock availability for all cart items before submitting
    const clientStockIssues: StockIssueItem[] = cartItems
      .filter((item) => item.product.stockQuantity !== undefined && item.quantity > item.product.stockQuantity)
      .map((item) => ({
        product: item.product,
        requestedQuantity: item.quantity,
        availableStock: Math.max(0, item.product.stockQuantity ?? 0),
      }));

    if (clientStockIssues.length > 0) {
      setStockIssues(clientStockIssues);
      setShowStockModal(true);
      return;
    }

    try {
      setIsSubmitting(true);

      const orderRequest = {
        customerInfo: {
          ...customerInfo,
          fullName: customerInfo.fullName.trim(),
          phone: customerInfo.phone.trim(),
          address: customerInfo.address.trim(),
        },
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        notes: customerInfo.notes?.trim(),
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        fcmToken: notificationsActive ? (fcmService.getLocalToken() || undefined) : undefined,
      };

      const createdOrder: Order = await ordersService.createOrderAtomic(orderRequest);

      localStorageUtil.addRecentOrder({
        orderId: createdOrder.orderId,
        customerName: createdOrder.customerInfo.fullName,
        totalAmount: createdOrder.total,
        createdAt: createdOrder.createdAt,
      });

      // Link order to device FCM token and send instant order placement push notification if enabled
      if (notificationsActive) {
        fcmService.linkOrderToDeviceToken(createdOrder.orderId);
        fcmService.notifyOrderStatusUpdate(createdOrder.orderId, 'pending');
        fcmService.displayLocalNotification({
          title: `🪔 Order Placed (#${createdOrder.orderId})`,
          body: 'Your festive order has been placed with Diyas N Duas!',
          url: `/track-order?id=${createdOrder.orderId}`,
          tag: `order-${createdOrder.orderId}-pending`,
        });
      }

      toast.success('Order Request Submitted!', `Order Reference #${createdOrder.orderId} received successfully.`);

      // Trigger 5-Second WhatsApp Countdown Modal
      setPendingOrder(createdOrder);
      setShowWhatsAppModal(true);
    } catch (err: any) {
      console.error('[Checkout Error]', err);
      const errMsg = err?.message || '';

      // If the error is about insufficient stock, show the friendly InsufficientStockModal instead of harsh error toast
      if (errMsg.toLowerCase().includes('insufficient stock') || errMsg.toLowerCase().includes('left in stock')) {
        const matchedItem = cartItems.find((i) => errMsg.includes(i.product.name));
        const parsedMatch = errMsg.match(/Only\s+(\d+)\s+left/i);
        const parsedStock = parsedMatch ? parseInt(parsedMatch[1], 10) : 1;

        const serverIssues: StockIssueItem[] = matchedItem
          ? [
              {
                product: matchedItem.product,
                requestedQuantity: matchedItem.quantity,
                availableStock: parsedStock,
              },
            ]
          : cartItems.map((i) => ({
              product: i.product,
              requestedQuantity: i.quantity,
              availableStock: Math.max(0, i.product.stockQuantity ?? 0),
            }));

        setStockIssues(serverIssues);
        setShowStockModal(true);
        return;
      }

      toast.error(
        'Order Creation Failed',
        err.message || 'Sorry, we could not place your order right now. Your cart remains safe.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
    toast.success('Cart Updated', 'Quantity adjusted to available stock. You can now confirm your order!');
  };

  const handleLaunchWhatsApp = () => {
    if (!pendingOrder) return;
    clearCart();
    setShowWhatsAppModal(false);
    openWhatsAppOrderLink(pendingOrder, settings?.whatsappNumber);
    navigate(`/order-confirmation/${pendingOrder.orderId}`, {
      state: { order: pendingOrder },
    });
  };

  const handleCloseModal = () => {
    if (!pendingOrder) return;
    clearCart();
    setShowWhatsAppModal(false);
    navigate(`/order-confirmation/${pendingOrder.orderId}`, {
      state: { order: pendingOrder },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative z-10">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Order Request Checkout</h1>
        <p className="text-sm text-slate-500">Provide contact details to receive your order confirmation & payment details.</p>
      </div>

      {/* Operational Ordering Notice when disabled */}
      {isOrderingDisabled && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 flex items-start gap-3 text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h4 className="font-bold">Order Requests Temporarily Suspended</h4>
            <p className="text-slate-600 dark:text-slate-300">
              Our store is currently not accepting new order requests. You may continue browsing our catalog and saving items to your cart or wishlist.
            </p>
          </div>
        </div>
      )}

      {/* Configurable Customer Instructions */}
      {settings?.checkoutInstructions && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-start gap-3 text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
          <Info className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
          <span>{settings.checkoutInstructions}</span>
        </div>
      )}

      {/* Professional Delivery Policy Banner / Progress Meter */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isFreeDelivery 
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100 shadow-sm' 
          : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isFreeDelivery 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                : 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
            }`}>
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                  {isFreeDelivery ? (
                    <>
                      <span>🎉 Congratulations! Free Delivery Unlocked</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                        <CheckCircle2 className="w-3 h-3" /> FREE
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Delivery Policy: Free Delivery on Orders ₹{freeDeliveryThreshold.toLocaleString('en-IN')}+</span>
                    </>
                  )}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {isFreeDelivery ? (
                  <span>Your cart value of {formatINR(cartSubtotal)} qualifies for ₹0 delivery charges.</span>
                ) : (
                  <span>
                    Add <strong className="font-black text-amber-700 dark:text-amber-300">{formatINR(amountNeededForFreeDelivery)}</strong> more to your order to save <strong className="font-bold">{formatINR(standardDeliveryFee)}</strong> delivery fee!
                  </span>
                )}
              </p>
            </div>
          </div>

          {!isFreeDelivery && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-xs transition-all self-start sm:self-auto flex-shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Add More Items</span>
            </button>
          )}
        </div>

        {/* Visual Progress Bar to Free Delivery */}
        {!isFreeDelivery && (
          <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/60">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              <span>Current Cart: {formatINR(cartSubtotal)}</span>
              <span>Free Delivery Goal: {formatINR(freeDeliveryThreshold)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Form & Items Review */}
        <div className="lg:col-span-2 space-y-6">
          <Card glass className="p-6">
            <CheckoutForm
              customerInfo={customerInfo}
              onChange={setCustomerInfo}
              errors={errors}
              disabled={isSubmitting || isOrderingDisabled}
            />
          </Card>

          {/* Instant Order Status Push Notification Preference Toggle */}
          <CheckoutNotificationToggle
            onToggleChange={handleToggleNotification}
            disabled={isSubmitting || isOrderingDisabled}
          />

          {/* Items Review */}
          <Card glass className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Review Order Items ({cartItems.length})
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {cartItems.map(({ product, quantity }) => {
                const discountPercent = formatDiscountPercentage(product.originalPrice, product.sellingPrice);
                const itemSubtotal = product.sellingPrice * quantity;

                return (
                  <div
                    key={product.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4 transition-all"
                  >
                    {/* Left: Product Image & Details */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <img
                        src={product.images?.[0] || '/logo.png'}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-200 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatINR(product.sellingPrice)}
                          </span>
                          {discountPercent > 0 && (
                            <span className="text-[10px] text-rose-500 font-extrabold">{discountPercent}% OFF</span>
                          )}
                        </div>

                        {/* Red warning line when quantity exceeds stock */}
                        {product.stockQuantity !== undefined && quantity > product.stockQuantity && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-md animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Only {product.stockQuantity} left in stock. Please adjust quantity.</span>
                          </div>
                        )}

                        {/* Max available stock reached notice */}
                        {product.stockQuantity !== undefined && quantity === product.stockQuantity && product.stockQuantity <= 5 && (
                          <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                            <span>Only {product.stockQuantity} available in stock</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right / Bottom on Mobile: Quantity Pill, Subtotal & Remove Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800/60 flex-shrink-0">
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <button
                          type="button"
                          disabled={isSubmitting || isOrderingDisabled}
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs">{quantity}</span>
                        <button
                          type="button"
                          disabled={isSubmitting || isOrderingDisabled}
                          onClick={() => {
                            if (product.stockQuantity !== undefined && quantity >= product.stockQuantity) {
                              toast.warning(
                                'Limited Stock Available',
                                `Only ${product.stockQuantity} piece${product.stockQuantity === 1 ? '' : 's'} available in stock for "${product.name}".`
                              );
                              return;
                            }
                            updateQuantity(product.id, quantity + 1);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            product.stockQuantity !== undefined && quantity >= product.stockQuantity
                              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          aria-label="Increase quantity"
                          title={
                            product.stockQuantity !== undefined && quantity >= product.stockQuantity
                              ? `Only ${product.stockQuantity} left in stock`
                              : 'Increase quantity'
                          }
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-sm text-slate-900 dark:text-slate-100 min-w-[65px] text-right">
                          {formatINR(itemSubtotal)}
                        </span>

                        <button
                          type="button"
                          disabled={isSubmitting || isOrderingDisabled}
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Order Summary & Confirmation Action */}
        <div className="space-y-4">
          <Card glass className="p-6 space-y-5 sticky top-24">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-200 dark:border-slate-800">
              Bill Breakdown
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Original Value</span>
                <span className="font-semibold line-through text-slate-400">{formatINR(originalTotal)}</span>
              </div>

              {savingsTotal > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Festive Discount</span>
                  </span>
                  <span>- {formatINR(savingsTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatINR(cartSubtotal)}</span>
              </div>

              {/* Promo Coupon Discount Line */}
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60 animate-fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TicketPercent className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Coupon ({appliedCoupon.code})</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span>- {formatINR(couponDiscount)}</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1 rounded-md text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                      title="Remove Coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tax Line if Enabled by Admin */}
              {isTaxEnabled && taxAmount > 0 && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <span>{taxName} ({taxRate}%)</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    +{formatINR(taxAmount)}
                  </span>
                </div>
              )}

              {/* Delivery Fee Line */}
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

              {/* Sub-threshold free delivery helper */}
              {!isFreeDelivery && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/60">
                  <span>Add {formatINR(amountNeededForFreeDelivery)} more to qualify for <strong>FREE Delivery</strong></span>
                </div>
              )}

              {/* Apply Promo Code Interactive Drawer / Input */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                {!showPromoInput && !appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => setShowPromoInput(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline cursor-pointer"
                  >
                    <TicketPercent className="w-3.5 h-3.5" />
                    <span>Have a promo coupon code? Apply here</span>
                  </button>
                ) : !appliedCoupon ? (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          placeholder="ENTER COUPON CODE"
                          className="w-full pl-3 pr-2 py-1.5 text-xs font-mono font-bold tracking-wider rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={isValidatingCoupon || !promoCodeInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {isValidatingCoupon ? 'Checking...' : 'APPLY'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPromoInput(false);
                          setCouponMessage(null);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {couponMessage && (
                      <p className={`text-[11px] font-semibold ${couponMessage.isError ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {couponMessage.text}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">Total Payable</span>
                  <span className="text-[10px] text-slate-400 block">All taxes & packaging included</span>
                </div>
                <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                  {formatINR(grandTotal)}
                </span>
              </div>
            </div>

            {/* Confirm Order Trigger */}
            <Button
              type="submit"
              size="lg"
              disabled={isOrderingDisabled}
              isLoading={isSubmitting}
              className={`w-full font-extrabold py-3.5 ${
                isOrderingDisabled
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-none'
                  : 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-none shadow-lg shadow-amber-400/20 btn-shine-sweep'
              }`}
            >
              <span>
                {isOrderingDisabled
                  ? 'ORDERS TEMPORARILY SUSPENDED'
                  : isSubmitting
                  ? 'Placing Order Request...'
                  : 'CONFIRM ORDER REQUEST'}
              </span>
              {!isSubmitting && !isOrderingDisabled && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              <div className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                <span>Zero online payment risk. Payment & delivery instructions confirmed directly via phone/WhatsApp.</span>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Direct Diyas N Duas transport packaging.</span>
              </div>
            </div>
          </Card>
        </div>
      </form>

      {/* Insufficient Stock Friendly Vector Alert Modal */}
      <InsufficientStockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        stockIssues={stockIssues}
        onAdjustStock={handleAdjustStock}
        onReviewCart={() => setShowStockModal(false)}
      />

      {/* 5-Second Animated WhatsApp Transition Popup Modal */}
      <WhatsAppTransitionModal
        isOpen={showWhatsAppModal}
        onClose={handleCloseModal}
        order={pendingOrder}
        onConfirmWhatsApp={handleLaunchWhatsApp}
      />
    </div>
  );
};
