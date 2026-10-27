import React, { useState } from 'react';
import { Product } from '../../types/product';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatINR, formatDiscountPercentage } from '../../utils/formatters';
import { ShoppingBag, Zap, Sparkles, ImageOff, ShieldCheck, Truck, Heart, Minus, Plus, MessageCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { PreBookButton } from './PreBookButton';
import { InterestedButton } from './InterestedButton';

export interface ProductDetailsViewProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({ product, onClose }) => {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);
  const discountPercent = formatDiscountPercentage(product.originalPrice, product.sellingPrice);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLimitedStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImg = images[selectedImgIndex] || null;

  const handleAddToCart = () => {
    addToCart(product, quantity, isOutOfStock);
    onClose();
  };

  const handleOrderNow = () => {
    addToCart(product, quantity, false);
    onClose();
    navigate(ROUTES.CUSTOMER.CHECKOUT);
  };

  const handlePreBookNow = () => {
    addToCart(product, quantity, true);
    onClose();
    navigate(ROUTES.CUSTOMER.CHECKOUT);
  };

  const descriptionText = product.description || 'Premium quality handcrafted diyas crafted to brighten your festive celebrations and prayers.';

  const content = (
    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
      {/* Left Column: Image Gallery */}
      <div className="space-y-3">
        <div className="relative w-full aspect-square sm:aspect-[4/3] md:aspect-square rounded-3xl overflow-hidden glass-card-3d border border-white/40 dark:border-brand-500/30">
          {currentImg && !imgError ? (
            <img
              src={currentImg}
              alt={`${product.name}${product.categoryName ? ` - ${product.categoryName}` : ''} - Handcrafted Diya | Diyas N Duas`}
              onError={() => setImgError(true)}
              decoding="async"
              width={600}
              height={600}
              className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
              <ImageOff className="w-12 h-12 mb-2 opacity-50" />
              <span className="text-xs font-semibold">Image Unavailable</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {product.badge ? (
              <Badge variant="brand" className="shadow-md bg-brand-500 text-white border-none text-xs px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1 text-amber-300" />
                {product.badge}
              </Badge>
            ) : <span />}

            <div className="flex items-center gap-2">
              {discountPercent > 0 && (
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-500 text-white shadow-md">
                  {discountPercent}% OFF
                </span>
              )}
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md active:scale-90 ${
                  isFavorited
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500'
                }`}
                aria-label={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Thumbnails */}
        {images.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImgIndex(idx);
                  setImgError(false);
                }}
                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                  selectedImgIndex === idx
                    ? 'border-brand-500 scale-105 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Title, Details, Pricing & Action Buttons */}
      <div className="space-y-5 flex flex-col justify-between h-full">
        <div className="space-y-4">
          {/* Header Info */}
          <div className="space-y-1">
            {product.categoryName && (
              <span className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest block">
                {product.categoryName}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              {product.name}
            </h2>
          </div>

          {/* Pricing & Stock Availability Box */}
          <div className="p-4 rounded-3xl glass-card-3d flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block">Offer Price</span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {formatINR(product.sellingPrice)}
                </span>
                {product.originalPrice > product.sellingPrice && (
                  <span className="text-sm text-slate-400 line-through font-semibold">
                    {formatINR(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <div>
              {isOutOfStock ? (
                product.allowPreOrder ? (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span>Pre-Order Available</span>
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="flex items-center gap-1 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                    <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Out of Stock (Inquire on WhatsApp)</span>
                  </Badge>
                )
              ) : isLimitedStock ? (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Limited Stock</span>
                </Badge>
              ) : (
                <Badge variant="success">In Stock</Badge>
              )}
            </div>
          </div>

          {/* Quantity Selector Control */}
          {!isOutOfStock && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl glass-surface">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Select Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors font-bold"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-black text-base text-slate-900 dark:text-slate-100">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Product Details & Multi-Paragraph Sections */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Product Details
            </h4>

            {/* Main Description */}
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
              {descriptionText}
            </p>

            {/* Additional Structured Paragraphs */}
            {product.sections && product.sections.length > 0 && (
              <div className="space-y-3 pt-1">
                {product.sections.map((sec, idx) => (
                  <div key={idx} className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 space-y-1">
                    {sec.title && sec.title.trim() && (
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wide">
                        {sec.title}
                      </h5>
                    )}
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Value Proposition Highlights */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Direct Home Request</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold">
              <Truck className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span>Safe Transport Box</span>
            </div>
          </div>
        </div>

        {/* Clean Inline Action Buttons at Bottom */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-3 pb-1 min-w-0">
          {isOutOfStock && !product.allowPreOrder ? (
            <>
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] sm:text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0 select-none">
                <span>Out of Stock</span>
              </div>

              <InterestedButton
                product={product}
                label="I'm Interested"
                className="flex-1 min-w-0 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-xl shadow-xs"
              />
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={handleAddToCart}
                className="flex-1 min-w-0 font-bold rounded-xl text-xs sm:text-sm py-2 sm:py-2.5"
                leftIcon={<ShoppingBag className="w-4 h-4 text-brand-500" />}
              >
                <span>{isOutOfStock ? 'Pre-Order' : 'Add to Cart'}</span>
              </Button>

              {isOutOfStock ? (
                <PreBookButton
                  onClick={handlePreBookNow}
                  label="Pre-Book Now"
                  className="flex-1 min-w-0 py-2 sm:py-2.5 px-3 text-xs sm:text-sm font-black rounded-xl"
                />
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  disabled={isOutOfStock}
                  onClick={handleOrderNow}
                  className="flex-1 min-w-0 font-black btn-shine-sweep bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 border-none shadow-sm rounded-xl py-2 sm:py-2.5 text-xs sm:text-sm"
                  leftIcon={<Zap className="w-4 h-4" />}
                >
                  <span>Order Now</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="block sm:hidden">
        <BottomSheet isOpen={Boolean(product)} onClose={onClose} title={product.name}>
          {content}
        </BottomSheet>
      </div>

      <div className="hidden sm:block">
        <Modal isOpen={Boolean(product)} onClose={onClose} title={product.name} maxWidth="max-w-4xl">
          {content}
        </Modal>
      </div>
    </>
  );
};
