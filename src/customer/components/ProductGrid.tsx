import React from 'react';
import { Product } from '../../types/product';
import { ProductCard } from './ProductCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Sparkles, SearchX } from 'lucide-react';

export interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectProduct: (product: Product) => void;
  searchTerm?: string;
  selectedCategoryName?: string;
  onResetFilters?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  error,
  onRetry,
  onSelectProduct,
  searchTerm,
  selectedCategoryName,
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 my-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonLoader key={i} variant="card" className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Diyas Catalog"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!products || products.length === 0) {
    if (searchTerm || selectedCategoryName) {
      return (
        <EmptyState
          icon={<SearchX className="w-8 h-8 text-amber-500" />}
          title="No Matching Diyas Found"
          description={`We couldn't find any products matching ${
            searchTerm ? `"${searchTerm}"` : ''
          } ${selectedCategoryName ? `in ${selectedCategoryName}` : ''}.`}
          actionText="Clear All Filters"
          onAction={onResetFilters}
        />
      );
    }

    return (
      <EmptyState
        icon={<Sparkles className="w-8 h-8 text-brand-500" />}
        title="No Products Available"
        description="Our festive catalog is currently being updated. Please check back shortly."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 my-4">
      {products.map((prod) => (
        <ProductCard key={prod.id} product={prod} onSelect={onSelectProduct} />
      ))}
    </div>
  );
};
