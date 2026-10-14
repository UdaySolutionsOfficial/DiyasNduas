import React, { useState, useEffect, useMemo } from 'react';
import { Category } from '../../types/category';
import { Product } from '../../types/product';
import { formatINR } from '../../utils/formatters';
import { 
  X, 
  RotateCcw, 
  SlidersHorizontal, 
  Check, 
  Sparkles, 
  IndianRupee, 
  ArrowUpDown, 
  FolderTree, 
  PackageCheck 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'newest';

export interface FilterValues {
  categoryId: string | null;
  minPrice: number;
  maxPrice: number;
  sortBy: SortOption;
  inStockOnly: boolean;
}

interface FlipkartFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  filters: FilterValues;
  onApplyFilters: (newFilters: FilterValues) => void;
  onResetFilters: () => void;
}

type TabType = 'price' | 'category' | 'sort' | 'stock';

export const FlipkartFilterDrawer: React.FC<FlipkartFilterDrawerProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  // 1. Calculate dynamic catalog bounds from available products
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

  // 2. Local draft filter state inside the drawer
  const [draftFilters, setDraftFilters] = useState<FilterValues>(filters);
  const [activeTab, setActiveTab] = useState<TabType>('price');

  // Keep draft in sync whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setDraftFilters({
        ...filters,
        minPrice: Math.max(catalogMinPrice, filters.minPrice),
        maxPrice: Math.min(catalogMaxPrice, filters.maxPrice),
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, filters, catalogMinPrice, catalogMaxPrice]);

  // 3. Dynamic Quick Price Presets based on catalog bounds
  const quickPricePresets = useMemo(() => {
    const range = catalogMaxPrice - catalogMinPrice;
    if (range <= 0) return [];

    const step1 = Math.round(catalogMinPrice + range * 0.25);
    const step2 = Math.round(catalogMinPrice + range * 0.5);
    const step3 = Math.round(catalogMinPrice + range * 0.75);

    return [
      { label: `Under ${formatINR(step1)}`, min: catalogMinPrice, max: step1 },
      { label: `${formatINR(step1)} - ${formatINR(step2)}`, min: step1, max: step2 },
      { label: `${formatINR(step2)} - ${formatINR(step3)}`, min: step2, max: step3 },
      { label: `Above ${formatINR(step3)}`, min: step3, max: catalogMaxPrice },
    ];
  }, [catalogMinPrice, catalogMaxPrice]);

  // 4. Calculate matching product count for the current draft
  const previewMatchingCount = useMemo(() => {
    return products.filter((p) => {
      if (draftFilters.categoryId && p.categoryId !== draftFilters.categoryId) return false;
      const price = p.sellingPrice || 0;
      if (price < draftFilters.minPrice || price > draftFilters.maxPrice) return false;
      if (draftFilters.inStockOnly && p.stockQuantity <= 0) return false;
      return true;
    }).length;
  }, [products, draftFilters]);

  // Check which sections have active custom filters
  const isPriceFiltered =
    draftFilters.minPrice > catalogMinPrice || draftFilters.maxPrice < catalogMaxPrice;
  const isCategoryFiltered = draftFilters.categoryId !== null;
  const isSortFiltered = draftFilters.sortBy !== 'featured';
  const isStockFiltered = draftFilters.inStockOnly;

  const totalActiveInDraft =
    (isPriceFiltered ? 1 : 0) +
    (isCategoryFiltered ? 1 : 0) +
    (isSortFiltered ? 1 : 0) +
    (isStockFiltered ? 1 : 0);

  const handleMinChange = (val: number) => {
    const clamped = Math.max(catalogMinPrice, Math.min(val, draftFilters.maxPrice));
    setDraftFilters((prev) => ({ ...prev, minPrice: clamped }));
  };

  const handleMaxChange = (val: number) => {
    const clamped = Math.min(catalogMaxPrice, Math.max(val, draftFilters.minPrice));
    setDraftFilters((prev) => ({ ...prev, maxPrice: clamped }));
  };

  const handleResetDraft = () => {
    setDraftFilters({
      categoryId: null,
      minPrice: catalogMinPrice,
      maxPrice: catalogMaxPrice,
      sortBy: 'featured',
      inStockOnly: false,
    });
    onResetFilters();
  };

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Flipkart-Style Filter Drawer Container */}
      <div className="relative w-full sm:max-w-md md:max-w-lg bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col z-10 animate-slide-in-right overflow-hidden border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">Filters</h3>
                {totalActiveInDraft > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-extrabold">
                    {totalActiveInDraft}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Refine your festive diyas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalActiveInDraft > 0 && (
              <button
                onClick={handleResetDraft}
                className="text-xs font-black text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Column Body (Flipkart Style Navigation + Content) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Navigation Tabs */}
          <div className="w-36 sm:w-40 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 overflow-y-auto">
            {/* Price Tab */}
            <button
              onClick={() => setActiveTab('price')}
              className={`w-full px-4 py-3.5 text-left text-xs font-bold transition-all flex items-center justify-between border-l-4 ${
                activeTab === 'price'
                  ? 'border-brand-500 bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <IndianRupee className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Price Range</span>
              </span>
              {isPriceFiltered && (
                <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              )}
            </button>

            {/* Category Tab */}
            <button
              onClick={() => setActiveTab('category')}
              className={`w-full px-4 py-3.5 text-left text-xs font-bold transition-all flex items-center justify-between border-l-4 ${
                activeTab === 'category'
                  ? 'border-brand-500 bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <FolderTree className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Categories</span>
              </span>
              {isCategoryFiltered && (
                <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              )}
            </button>

            {/* Sort Tab */}
            <button
              onClick={() => setActiveTab('sort')}
              className={`w-full px-4 py-3.5 text-left text-xs font-bold transition-all flex items-center justify-between border-l-4 ${
                activeTab === 'sort'
                  ? 'border-brand-500 bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Sort By</span>
              </span>
              {isSortFiltered && (
                <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              )}
            </button>

            {/* Stock Tab */}
            <button
              onClick={() => setActiveTab('stock')}
              className={`w-full px-4 py-3.5 text-left text-xs font-bold transition-all flex items-center justify-between border-l-4 ${
                activeTab === 'stock'
                  ? 'border-brand-500 bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <PackageCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Availability</span>
              </span>
              {isStockFiltered && (
                <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              )}
            </button>
          </div>

          {/* Right Tab Content Pane */}
          <div className="flex-1 p-5 overflow-y-auto bg-white dark:bg-slate-900">
            {/* 1. PRICE TAB CONTENT */}
            {activeTab === 'price' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Price Range
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Dynamic range based on {products.length} products ({formatINR(catalogMinPrice)} to {formatINR(catalogMaxPrice)})
                  </p>
                </div>

                {/* Min / Max Numeric Display Boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Min Price</span>
                    <div className="flex items-center text-sm font-black text-brand-600 dark:text-brand-400">
                      <span>₹</span>
                      <input
                        type="number"
                        min={catalogMinPrice}
                        max={draftFilters.maxPrice}
                        value={draftFilters.minPrice}
                        onChange={(e) => handleMinChange(Number(e.target.value))}
                        className="w-full bg-transparent font-black text-sm ml-1 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-1 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Price</span>
                    <div className="flex items-center justify-end text-sm font-black text-brand-600 dark:text-brand-400">
                      <span>₹</span>
                      <input
                        type="number"
                        min={draftFilters.minPrice}
                        max={catalogMaxPrice}
                        value={draftFilters.maxPrice}
                        onChange={(e) => handleMaxChange(Number(e.target.value))}
                        className="w-full bg-transparent font-black text-sm text-right ml-1 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Interactive Dual Range Slider Control */}
                <div className="space-y-3 pt-2">
                  <div className="relative h-6 flex items-center">
                    {/* Background Bar */}
                    <div className="absolute w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800" />
                    {/* Active Highlighted Range Bar */}
                    <div
                      className="absolute h-2 rounded-full bg-gradient-to-r from-brand-500 to-amber-500"
                      style={{
                        left: `${
                          catalogMaxPrice > catalogMinPrice
                            ? ((draftFilters.minPrice - catalogMinPrice) /
                                (catalogMaxPrice - catalogMinPrice)) *
                              100
                            : 0
                        }%`,
                        right: `${
                          catalogMaxPrice > catalogMinPrice
                            ? 100 -
                              ((draftFilters.maxPrice - catalogMinPrice) /
                                (catalogMaxPrice - catalogMinPrice)) *
                                100
                            : 0
                        }%`,
                      }}
                    />

                    {/* Dual Range Inputs */}
                    <input
                      type="range"
                      min={catalogMinPrice}
                      max={catalogMaxPrice}
                      value={draftFilters.minPrice}
                      onChange={(e) => handleMinChange(Number(e.target.value))}
                      className="absolute w-full h-2 opacity-0 pointer-events-auto cursor-pointer"
                      style={{ zIndex: 3 }}
                    />
                    <input
                      type="range"
                      min={catalogMinPrice}
                      max={catalogMaxPrice}
                      value={draftFilters.maxPrice}
                      onChange={(e) => handleMaxChange(Number(e.target.value))}
                      className="absolute w-full h-2 opacity-0 pointer-events-auto cursor-pointer"
                      style={{ zIndex: 4 }}
                    />

                    {/* Visual Thumb Indicators */}
                    <div
                      className="absolute w-5 h-5 rounded-full bg-white border-2 border-brand-500 shadow-md -translate-x-1/2 pointer-events-none transition-transform"
                      style={{
                        left: `${
                          catalogMaxPrice > catalogMinPrice
                            ? ((draftFilters.minPrice - catalogMinPrice) /
                                (catalogMaxPrice - catalogMinPrice)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                    <div
                      className="absolute w-5 h-5 rounded-full bg-white border-2 border-amber-500 shadow-md -translate-x-1/2 pointer-events-none transition-transform"
                      style={{
                        left: `${
                          catalogMaxPrice > catalogMinPrice
                            ? ((draftFilters.maxPrice - catalogMinPrice) /
                                (catalogMaxPrice - catalogMinPrice)) *
                              100
                            : 100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>{formatINR(catalogMinPrice)}</span>
                    <span>{formatINR(catalogMaxPrice)}</span>
                  </div>
                </div>

                {/* Flipkart Quick Price Range Chips */}
                {quickPricePresets.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Quick Price Brackets
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {quickPricePresets.map((preset, idx) => {
                        const isSelected =
                          draftFilters.minPrice === preset.min &&
                          draftFilters.maxPrice === preset.max;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setDraftFilters((prev) => ({
                                ...prev,
                                minPrice: preset.min,
                                maxPrice: preset.max,
                              }));
                            }}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between border ${
                              isSelected
                                ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{preset.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. CATEGORY TAB CONTENT */}
            {activeTab === 'category' && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Product Categories
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Dynamic collections managed in store
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  {/* All Collections Option */}
                  <label
                    onClick={() => setDraftFilters((prev) => ({ ...prev, categoryId: null }))}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                      draftFilters.categoryId === null
                        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        draftFilters.categoryId === null ? 'border-brand-500 bg-brand-500' : 'border-slate-400'
                      }`}>
                        {draftFilters.categoryId === null && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        All Collections
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700/60 text-slate-500">
                      {products.length}
                    </span>
                  </label>

                  {/* Dynamic Category List from Firestore */}
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.categoryId === cat.id).length;
                    const isSelected = draftFilters.categoryId === cat.id;

                    return (
                      <label
                        key={cat.id}
                        onClick={() => setDraftFilters((prev) => ({ ...prev, categoryId: cat.id }))}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-brand-500 bg-brand-500' : 'border-slate-400'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="text-xs font-bold">{cat.name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700/60 text-slate-500">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. SORT TAB CONTENT */}
            {activeTab === 'sort' && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Sort Products By
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Order items to find the best match
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {[
                    { id: 'featured', label: 'Popular & Featured First' },
                    { id: 'price-asc', label: 'Price: Low to High' },
                    { id: 'price-desc', label: 'Price: High to Low' },
                    { id: 'discount', label: 'Biggest Discount (% Off)' },
                    { id: 'newest', label: 'Newest Arrivals' },
                  ].map((option) => {
                    const isSelected = draftFilters.sortBy === option.id;

                    return (
                      <label
                        key={option.id}
                        onClick={() =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            sortBy: option.id as SortOption,
                          }))
                        }
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                        }`}
                      >
                        <span className="text-xs font-bold">{option.label}</span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-brand-500 bg-brand-500' : 'border-slate-400'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. STOCK TAB CONTENT */}
            {activeTab === 'stock' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Item Availability
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Filter out sold-out items
                  </p>
                </div>

                <label
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      inStockOnly: !prev.inStockOnly,
                    }))
                  }
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                    draftFilters.inStockOnly
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">In Stock Items Only</span>
                    <span className="text-[11px] text-slate-400 block">
                      Show only diyas ready for immediate delivery
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    draftFilters.inStockOnly ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400'
                  }`}>
                    {draftFilters.inStockOnly && <Check className="w-4 h-4" />}
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Actions Bar (Flipkart Style Apply Button) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 font-bold text-slate-600 dark:text-slate-300"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleApply}
            className="flex-[2] font-black shadow-lg shadow-brand-500/25 bg-gradient-to-r from-brand-600 to-amber-500 text-white"
          >
            Apply ({previewMatchingCount} Diyas)
          </Button>
        </div>
      </div>
    </div>
  );
};
