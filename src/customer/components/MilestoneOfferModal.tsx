import React, { useState } from 'react';
import { SpecialOfferConfig, SpecialOfferProduct } from '../../types/specialOffer';
import { CartItem } from '../../utils/localStorage';
import { formatINR } from '../../utils/formatters';
import { Sparkles, Gift, Check, ArrowRight, X, Flame, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface MilestoneOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SpecialOfferConfig;
  cartItems: CartItem[];
  onAddOfferProduct: (product: any, offerPrice: number) => void;
  onProceedToCheckout?: () => void;
}

export const MilestoneOfferModal: React.FC<MilestoneOfferModalProps> = ({
  isOpen,
  onClose,
  config,
  cartItems,
  onAddOfferProduct,
  onProceedToCheckout,
}) => {
  const [addingId, setAddingId] = useState<string | null>(null);

  if (!isOpen || !config.enabled || !config.products || config.products.length === 0) {
    return null;
  }

  const handleClaim = (item: SpecialOfferProduct) => {
    setAddingId(item.productId);
    const productSnapshot = {
      id: item.productId,
      name: item.productName,
      images: [item.productImage],
      categoryName: item.categoryName || '',
      originalPrice: item.originalPrice,
      sellingPrice: item.sellingPrice,
      stockQuantity: item.stockQuantity,
      inStock: item.stockQuantity > 0,
    };
    onAddOfferProduct(productSnapshot, item.offerPrice);
    setTimeout(() => {
      setAddingId(null);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
    >
      {/* Festive Background Sparkle Lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
      </div>

      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-400 dark:border-amber-500 overflow-hidden flex flex-col max-h-[92vh] festive-modal-animate"
      >
        {/* Festive Shimmering Ribbon Header Accent */}
        <div className="h-3 w-full bg-gradient-to-r from-amber-400 via-orange-500 via-yellow-400 to-amber-500 animate-gradient-slow" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 shadow-md backdrop-blur-xs transition-transform active:scale-95"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body Container (Scrollable) */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Milestone Celebratory Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 dark:from-amber-950/70 dark:via-orange-950/70 dark:to-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-600 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="uppercase tracking-wider">🎉 Milestone Unlocked (₹{config.minCartThreshold}+ Reached)</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center justify-center gap-2 flex-wrap">
              <Gift className="w-6 h-6 text-brand-500 animate-bounce" />
              <span>{config.title || "Exclusive Cart Milestone Deals! 🪔✨"}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              {config.subtitle || "Congratulations! Because your cart reached our festive threshold, you've unlocked these special deals at exclusive subsidized prices!"}
            </p>
          </div>

          {/* Promotional Banner (if configured) */}
          {config.bannerUrl && (
            <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border-2 border-amber-200 dark:border-amber-800/80 max-h-48 sm:max-h-56 bg-gradient-to-r from-amber-500/10 to-orange-500/10 group">
              <img
                src={config.bannerUrl}
                alt="Milestone Special Offer"
                className="w-full h-full object-cover max-h-48 sm:max-h-56 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-2.5 left-2.5 bg-rose-600/95 backdrop-blur-xs text-white text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Flame className="w-3.5 h-3.5 text-yellow-300" />
                <span>LIMITED TIME CLEARANCE DEALS</span>
              </div>
            </div>
          )}

          {/* Products Offer Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Unlocked Clearance Products ({config.products.length})</span>
              </h3>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                1-Tap Add to Order
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {config.products.map((item) => {
                const isClaimedInCart = cartItems.some(
                  (c) => c.product.id === item.productId && c.isSpecialOffer
                );
                const discountPercent = Math.max(
                  0,
                  Math.round(((item.originalPrice - item.offerPrice) / item.originalPrice) * 100)
                );
                const isBusy = addingId === item.productId;

                return (
                  <div
                    key={item.productId}
                    className={`relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isClaimedInCart
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 shadow-sm hover:shadow-lg'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 relative">
                        <img
                          src={item.productImage || '/logo.png'}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        {item.categoryName && (
                          <span className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400 uppercase tracking-widest block truncate">
                            {item.categoryName}
                          </span>
                        )}
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-1">
                          {item.productName}
                        </h4>

                        {/* Pricing Details */}
                        <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                          <span className="text-base font-black text-amber-600 dark:text-amber-400">
                            {formatINR(item.offerPrice)}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 line-through">
                            {formatINR(item.originalPrice)}
                          </span>
                          {discountPercent > 0 && (
                            <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 px-1.5 py-0.5 rounded-md">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>

                        {item.stockQuantity !== undefined && item.stockQuantity > 0 && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Stock: {item.stockQuantity} available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      {isClaimedInCart ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 text-xs font-black flex items-center justify-center gap-1.5 border border-amber-300 dark:border-amber-700 shadow-xs">
                          <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Deal Added to Cart ✓</span>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isBusy}
                          onClick={() => handleClaim(item)}
                          className="w-full !py-2 !text-xs !font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-md active:scale-98 transition-transform"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          Claim Deal at {formatINR(item.offerPrice)}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>Items will be packed along with your festive order!</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-initial !text-xs !font-bold"
            >
              Close
            </Button>

            {onProceedToCheckout && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="flex-1 sm:flex-initial !text-xs !font-black bg-gradient-to-r from-brand-600 to-brand-500 shadow-sm"
              >
                Proceed to Checkout
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
