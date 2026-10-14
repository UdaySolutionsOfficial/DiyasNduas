import React, { useState } from 'react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDiscountPercentage } from '../../utils/formatters';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { ProductDetailsView } from '../components/ProductDetailsView';
import { Product } from '../../types/product';

export const Wishlist: React.FC = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-fade-in">
        <EmptyState
          icon={<Heart className="w-10 h-10 text-rose-500" />}
          title="Your Wishlist is Empty"
          description="Your favorites will appear here. Explore our products and save the ones you love."
          actionText="EXPLORE PRODUCTS"
          onAction={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Your Wishlist Favorites</h1>
        <p className="text-sm text-slate-500">
          Saved festive diyas ({wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlistItems.map((product) => {
          const discountPercent = formatDiscountPercentage(product.originalPrice, product.sellingPrice);
          const isOutOfStock = product.stockQuantity <= 0;

          return (
            <Card key={product.id} glass className="p-4 flex gap-4 items-center justify-between rounded-2xl">
              <div
                onClick={() => setSelectedProduct(product)}
                className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                <img
                  src={product.images?.[0] || ''}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                {product.categoryName && (
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest block">
                    {product.categoryName}
                  </span>
                )}
                <h3
                  onClick={() => setSelectedProduct(product)}
                  className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-brand-600"
                >
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

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isOutOfStock ? 'ghost' : 'primary'}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product, 1)}
                    className="text-xs py-1 px-3"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                    <span>Add to Cart</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromWishlist(product.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    aria-label="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <ProductDetailsView
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
