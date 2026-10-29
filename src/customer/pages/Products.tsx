import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductSearch } from '../components/ProductSearch';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductGrid } from '../components/ProductGrid';
import { ProductDetailsView } from '../components/ProductDetailsView';
import { productsService } from '../../services/products.service';
import { Product } from '../../types/product';
import { FilterValues } from '../components/FlipkartFilterDrawer';
import { useDocumentSeo } from '../hooks/useDocumentSeo';

export const Products: React.FC = () => {
  useDocumentSeo({
    title: 'Full Festive Diyas Collection',
    description: 'Browse all handcrafted clay diyas, brass lamps, and sacred essentials. Filter by price, category, and discounts with safe India-wide delivery.',
    canonicalPath: '/products',
    ogImage: 'https://diyasnduas.com/og-products.jpg',
    ogImageAlt: 'Diyas N Duas Handcrafted Terracotta & Brass Diyas Collection',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [products, setProducts] = useState<Product[]>(() => productsService.getCachedProducts(true));
  const [loading, setLoading] = useState(() => productsService.getCachedProducts(true).length === 0);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategory);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  


  useEffect(() => {
    const unsubscribe = productsService.subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    }, true);
    return () => unsubscribe();
  }, []);

  // Dynamic catalog price bounds
  const { catalogMinPrice, catalogMaxPrice } = useMemo(() => {
    if (!products.length) return { catalogMinPrice: 0, catalogMaxPrice: 2000 };
    const prices = products.map((p) => p.sellingPrice || 0);
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return { catalogMinPrice: min, catalogMaxPrice: max === min ? min + 1000 : max };
  }, [products]);

  const [filters, setFilters] = useState<FilterValues>({
    categoryId: initialCategory,
    minPrice: 0,
    maxPrice: 999999,
    sortBy: 'featured',
    inStockOnly: false,
  });

  // Keep price range bounded by catalog bounds
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categoryId: selectedCategoryId,
      minPrice: prev.minPrice === 0 ? catalogMinPrice : Math.max(catalogMinPrice, prev.minPrice),
      maxPrice: prev.maxPrice === 999999 ? catalogMaxPrice : Math.min(catalogMaxPrice, prev.maxPrice),
    }));
  }, [catalogMinPrice, catalogMaxPrice, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      // 1. Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Category filter
      if (selectedCategoryId && p.categoryId !== selectedCategoryId) {
        return false;
      }

      // 3. Price filter
      const price = p.sellingPrice || 0;
      if (price < filters.minPrice || price > filters.maxPrice) {
        return false;
      }

      // 4. In Stock filter
      if (filters.inStockOnly && p.stockQuantity <= 0) {
        return false;
      }

      return true;
    });

    // 5. Dynamic Sorting
    switch (filters.sortBy) {
      case 'price-asc':
        list.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
        break;
      case 'price-desc':
        list.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
        break;
      case 'discount':
        list.sort((a, b) => {
          const discA = a.originalPrice > a.sellingPrice ? (a.originalPrice - a.sellingPrice) / a.originalPrice : 0;
          const discB = b.originalPrice > b.sellingPrice ? (b.originalPrice - b.sellingPrice) / b.originalPrice : 0;
          return discB - discA;
        });
        break;
      case 'newest':
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case 'featured':
      default:
        list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return list;
  }, [products, searchTerm, selectedCategoryId, filters]);

  const handleSelectCategory = (catId: string | null) => {
    setSelectedCategoryId(catId);
    setFilters((prev) => ({ ...prev, categoryId: catId }));
    if (catId) {
      setSearchParams({ category: catId });
    } else {
      setSearchParams({});
    }
  };

  const handleResetAllFilters = () => {
    setSearchTerm('');
    handleSelectCategory(null);
    setFilters({
      categoryId: null,
      minPrice: catalogMinPrice,
      maxPrice: catalogMaxPrice,
      sortBy: 'featured',
      inStockOnly: false,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Full Diyas Collection</h1>
        <p className="text-sm text-slate-500">Browse all handcrafted clay diyas, brass lamps, and sacred essentials.</p>
      </div>

      <div className="space-y-4">
        <ProductSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          resultCount={filteredProducts.length}
        />
        <CategoryFilter
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
          products={products}
          filters={filters}
          onUpdateFilters={setFilters}
          onResetFilters={handleResetAllFilters}
        />
      </div>

      <ProductGrid
        products={filteredProducts}
        loading={loading}
        onSelectProduct={setSelectedProduct}
        searchTerm={searchTerm}
        onResetFilters={handleResetAllFilters}
      />

      <ProductDetailsView
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
