import React, { useState } from 'react';
import { Product } from '../../types/product';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatINR, formatDiscountPercentage } from '../../utils/formatters';
import { Sparkles, Eye, ShoppingBag, ImageOff, Heart, MessageCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { PreBookButton } from './PreBookButton';
import { InterestedButton } from './InterestedButton';

export interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const discountPercent = formatDiscountPercentage(product.originalPrice, product.sellingPrice);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLimitedStock = product.stockQuantity > 0 && product.stockQuantity <= 10;

  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, isOutOfStock);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col justify-between overflow-hidden p-3.5 sm:p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 mb-3 shadow-inner">
        {mainImage && !imgError ? (
          <img
            src={mainImage}
            alt={`${product.name}${product.categoryName ? ` - ${product.categoryName}` : ''} | Diyas N Duas`}
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 ${
              isOutOfStock ? 'opacity-85' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <ImageOff className="w-8 h-8 mb-1 opacity-50" />
            <span className="text-[10px] font-semibold">Image Unavailable</span>
          </div>
        )}

        {/* Top Badges (Promotional Badge & Discount Percentage) */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none">
          {product.badge ? (
            <Badge variant="brand" className="shadow-md backdrop-blur-md bg-brand-500 text-white border-none text-[10px]">
              <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-300" />
              {product.badge}
            </Badge>
          ) : <span />}

          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-xl text-[11px] font-black bg-rose-500 text-white shadow-md">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Floating Heart Wishlist Action Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute bottom-2 right-2 p-2 rounded-full backdrop-blur-md transition-all shadow-md active:scale-90 ${
            isFavorited
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500'
          }`}
          aria-label={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Product Information */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {product.categoryName && (
            <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest block">
              {product.categoryName}
            </span>
          )}
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price & Stock Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {formatINR(product.sellingPrice)}
            </span>
            {product.originalPrice > product.sellingPrice && (
              <span className="text-xs text-slate-400 line-through font-medium">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Stock Availability Pill */}
          <div className="flex items-center justify-between text-[11px] font-semibold">
            {isOutOfStock ? (
              product.allowPreOrder ? (
                <span className="text-amber-700 dark:text-amber-300 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span>Pre-Order Available</span>
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Out of Stock</span>
                </span>
              )
            ) : isLimitedStock ? (
              <span className="text-amber-500 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Limited Stock</span>
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">In Stock</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-1 flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onSelect(product)}
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
              title="View Product Details"
              aria-label="View Details"
            >
              <Eye className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Details</span>
            </button>

            {isOutOfStock ? (
              product.allowPreOrder ? (
                <PreBookButton
                  onClick={handleAddToCart}
                  className="flex-1 min-w-0 text-[10px] sm:text-xs py-1.5 px-2 sm:px-3 font-black"
                  title="Pre-Book this Item"
                />
              ) : (
                <InterestedButton
                  product={product}
                  label="Interested"
                  className="flex-1 min-w-0 text-[10px] sm:text-xs py-1.5 px-2 sm:px-3 font-bold"
                />
              )
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleAddToCart}
                className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 btn-shine-sweep rounded-xl text-[11px] sm:text-xs font-bold"
                aria-label="Add to Cart"
              >
                <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                <span>Add</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
