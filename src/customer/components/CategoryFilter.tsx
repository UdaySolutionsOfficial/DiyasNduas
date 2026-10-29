import React, { useEffect, useState, useMemo } from 'react';
import { Category } from '../../types/category';
import { Product } from '../../types/product';
import { categoriesService } from '../../services/categories.service';
import { Pill } from '../../components/ui/Pill';
import { Sparkles, SlidersHorizontal, X, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      return typeof categoriesService.getCachedCategories === 'function'
        ? categoriesService.getCachedCategories()
        : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => categories.length === 0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Compute product count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

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

  if (loading && categories.length === 0) {
    return (
      <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none items-center">
        <Pill
          active={selectedCategoryId === null}
          onClick={() => onSelectCategory(null)}
          className="text-xs font-bold py-1.5 px-3 flex-shrink-0"
        >
          ✨ All Diyas
        </Pill>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Categories Row Header with Filters Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Categories
          </h3>
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Show All</span>
            </button>
          )}
        </div>

        {/* Filters Trigger Button */}
        {showAdvancedFilter && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className={`relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border shadow-xs active:scale-95 cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-gradient-to-r from-brand-600 to-amber-500 text-white border-brand-500 shadow-brand-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
              aria-label="Open Price & Category Filters"
              title="Filter by Price & Category"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Price & Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-brand-600 text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* MOBILE SCREEN: Categories listed down vertically without any horizontal scrolling */}
      <div className="sm:hidden space-y-1.5 animate-fade-in">
        <div className="grid grid-cols-2 gap-1.5">
          {/* All Collections - Prominent Top Card */}
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`col-span-2 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all border shadow-xs cursor-pointer ${
              selectedCategoryId === null
                ? 'bg-gradient-to-r from-maroon-700 via-brand-600 to-terracotta-600 text-white border-maroon-800 shadow-maroon-900/25 scale-[1.01]'
                : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-3.5 h-3.5 ${selectedCategoryId === null ? 'text-amber-300' : 'text-amber-500'}`} />
              <span>All Collections</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              selectedCategoryId === null
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {products.length}
            </span>
          </button>

          {/* Dynamic Categories (showing top 4 or all if expanded, so it is never overwhelming) */}
          {(isMobileExpanded ? categories : categories.slice(0, 4)).map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold transition-all border shadow-xs text-left cursor-pointer min-h-[40px] ${
                  isSelected
                    ? 'bg-gradient-to-r from-maroon-700 to-terracotta-600 text-white border-maroon-800 shadow-md shadow-maroon-900/20 scale-[1.02] z-10'
                    : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate pr-1">{cat.name}</span>
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black flex-shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Interactive Expand / Collapse Toggle if > 4 categories (Keeps mobile clean & not overwhelming) */}
        {categories.length > 4 && (
          <button
            type="button"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors cursor-pointer"
          >
            <span>{isMobileExpanded ? 'Show fewer categories' : `Show all ${categories.length} categories`}</span>
            {isMobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* DESKTOP VIEW: Clean flex wrap of categories (No horizontal scrolling on wide screens either) */}
      <div className="hidden sm:flex flex-wrap items-center gap-2">
        <Pill
          active={selectedCategoryId === null}
          onClick={() => onSelectCategory(null)}
          icon={<Sparkles className="w-3.5 h-3.5" />}
          className="font-extrabold shadow-sm"
        >
          All Collections ({products.length})
        </Pill>

        {categories.map((cat) => (
          <Pill
            key={cat.id}
            active={selectedCategoryId === cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="font-bold transition-all"
          >
            {cat.name} {categoryCounts[cat.id] ? `(${categoryCounts[cat.id]})` : ''}
          </Pill>
        ))}
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
