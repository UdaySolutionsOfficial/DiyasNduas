import React, { useEffect, useState, useMemo } from 'react';
import { Category } from '../../types/category';
import { Product } from '../../types/product';
import { categoriesService } from '../../services/categories.service';
import { Pill } from '../../components/ui/Pill';
import { Sparkles, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { FlipkartFilterDrawer, FilterValues, SortOption } from './FlipkartFilterDrawer';
import { formatINR } from '../../utils/formatters';

export interface CategoryFilterProps {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  products?: Product[];
  filters?: FilterValues;
  onUpdateFilters?: (filters: FilterValues) => void;
  onResetFilters?: () => void;
  showAdvancedFilter?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategoryId,
  onSelectCategory,
  products = [],
  filters,
  onUpdateFilters,
  onResetFilters,
  showAdvancedFilter = true,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesService.getAllCategories();
        setCategories(data);
      } catch (err) {
        console.warn('[CategoryFilter]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Dynamic price bounds
  const { catalogMinPrice, catalogMaxPrice } = useMemo(() => {
    if (!products || products.length === 0) {
      return { catalogMinPrice: 0, catalogMaxPrice: 2000 };
    }
    const prices = products.map((p) => p.sellingPrice || 0);
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return {
      catalogMinPrice: min,
      catalogMaxPrice: max === min ? min + 1000 : max,
    };
  }, [products]);

  // Default filter values if parent didn't supply them
  const currentFilters: FilterValues = useMemo(() => {
    return (
      filters || {
        categoryId: selectedCategoryId,
        minPrice: catalogMinPrice,
        maxPrice: catalogMaxPrice,
        sortBy: 'featured',
        inStockOnly: false,
      }
    );
  }, [filters, selectedCategoryId, catalogMinPrice, catalogMaxPrice]);

  const isPriceFiltered =
    currentFilters.minPrice > catalogMinPrice || currentFilters.maxPrice < catalogMaxPrice;
  const isSortFiltered = currentFilters.sortBy !== 'featured';
  const isStockFiltered = currentFilters.inStockOnly;

  const activeFilterCount =
    (isPriceFiltered ? 1 : 0) +
    (selectedCategoryId !== null ? 1 : 0) +
    (isSortFiltered ? 1 : 0) +
    (isStockFiltered ? 1 : 0);

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'price-asc':
        return 'Price: Low to High';
      case 'price-desc':
        return 'Price: High to Low';
      case 'discount':
        return 'Highest Discount';
      case 'newest':
        return 'Newest Arrivals';
      default:
        return 'Popular';
    }
  };

  const handleApplyDrawerFilters = (newFilters: FilterValues) => {
    if (onSelectCategory && newFilters.categoryId !== selectedCategoryId) {
      onSelectCategory(newFilters.categoryId);
    }
    if (onUpdateFilters) {
      onUpdateFilters(newFilters);
    }
  };

  const handleResetPriceFilter = () => {
    if (onUpdateFilters) {
      onUpdateFilters({
        ...currentFilters,
        minPrice: catalogMinPrice,
        maxPrice: catalogMaxPrice,
      });
    }
  };

  const handleResetSort = () => {
    if (onUpdateFilters) {
      onUpdateFilters({
        ...currentFilters,
        sortBy: 'featured',
      });
    }
  };

  const handleResetStock = () => {
    if (onUpdateFilters) {
      onUpdateFilters({
        ...currentFilters,
        inStockOnly: false,
      });
    }
  };

  const handleResetAll = () => {
    onSelectCategory(null);
    if (onResetFilters) {
      onResetFilters();
    } else if (onUpdateFilters) {
      onUpdateFilters({
        categoryId: null,
        minPrice: catalogMinPrice,
        maxPrice: catalogMaxPrice,
        sortBy: 'featured',
        inStockOnly: false,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-28 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Categories Row Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Categories
        </h3>

        {selectedCategoryId && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Show All
          </button>
        )}
      </div>

      {/* Categories Track on Left + Flipkart Filter Button in the Marked Area on Right */}
      <div className="flex items-center justify-between gap-3">
        {/* Horizontal Scroll Track for Categories */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 scrollbar-none touch-callout-none no-scrollbar min-w-0">
          <Pill
            active={selectedCategoryId === null}
            onClick={() => onSelectCategory(null)}
            icon={<Sparkles className="w-3.5 h-3.5" />}
            className="flex-shrink-0 font-extrabold shadow-sm"
          >
            All Collections
          </Pill>

          {categories.map((cat) => (
            <Pill
              key={cat.id}
              active={selectedCategoryId === cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="flex-shrink-0 font-bold transition-all"
            >
              {cat.name}
            </Pill>
          ))}
        </div>

        {/* Flipkart Style Filter Trigger Button (Directly in the Marked Spot - Icon only on mobile, text on desktop) */}
        {showAdvancedFilter && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className={`relative inline-flex items-center justify-center gap-2 p-2 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-black transition-all border shadow-xs active:scale-95 cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-gradient-to-r from-brand-600 to-amber-500 text-white border-brand-500 shadow-brand-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
              aria-label="Open Price & Category Filters"
              title="Filter by Price & Category"
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Price & Filters</span>
              {activeFilterCount > 0 && (
                <>
                  {/* Desktop badge inline */}
                  <span className="hidden sm:flex w-4 h-4 rounded-full bg-white text-brand-600 text-[10px] font-black items-center justify-center">
                    {activeFilterCount}
                  </span>
                  {/* Mobile floating notification badge */}
                  <span className="sm:hidden absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900">
                    {activeFilterCount}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Active Filter Chips / Pills (Instant One-Click Dismissal) */}
      {showAdvancedFilter && activeFilterCount > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs animate-fade-in">
          {/* Price Range Chip */}
          {isPriceFiltered && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 font-bold text-[11px] shadow-xs">
              <span>
                {formatINR(currentFilters.minPrice)} - {formatINR(currentFilters.maxPrice)}
              </span>
              <button
                type="button"
                onClick={handleResetPriceFilter}
                className="hover:text-rose-500 p-0.5"
                title="Remove price filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Sort Chip */}
          {isSortFiltered && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50 font-bold text-[11px] shadow-xs">
              <ArrowUpDown className="w-3 h-3 text-brand-500" />
              <span>{getSortLabel(currentFilters.sortBy)}</span>
              <button
                type="button"
                onClick={handleResetSort}
                className="hover:text-rose-500 p-0.5"
                title="Reset sort"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Stock Chip */}
          {isStockFiltered && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 font-bold text-[11px] shadow-xs">
              <span>In Stock Only</span>
              <button
                type="button"
                onClick={handleResetStock}
                className="hover:text-rose-500 p-0.5"
                title="Remove stock filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Clear All Text Button */}
          <button
            type="button"
            onClick={handleResetAll}
            className="text-[11px] font-black text-rose-500 hover:text-rose-600 transition-colors ml-1 px-1.5 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Flipkart-Style Filter Drawer Component */}
      {showAdvancedFilter && (
        <FlipkartFilterDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          products={products}
          categories={categories}
          filters={{
            ...currentFilters,
            categoryId: selectedCategoryId,
          }}
          onApplyFilters={handleApplyDrawerFilters}
          onResetFilters={handleResetAll}
        />
      )}
    </div>
  );
};
