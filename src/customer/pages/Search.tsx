import React, { useEffect, useState, useMemo } from 'react';
import { ProductSearch } from '../components/ProductSearch';
import { ProductGrid } from '../components/ProductGrid';
import { ProductDetailsView } from '../components/ProductDetailsView';
import { productsService } from '../../services/products.service';
import { Product } from '../../types/product';

export const Search: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await productsService.getAllProducts(true);
        setProducts(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q)
    );
  }, [products, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Search Diyas & Lamps</h1>
        <p className="text-sm text-slate-500">Search by diya name, material, or festive category.</p>
      </div>

      <ProductSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        resultCount={searchResults.length}
      />

      <ProductGrid
        products={searchResults}
        loading={loading}
        onSelectProduct={setSelectedProduct}
        searchTerm={searchTerm}
        onResetFilters={() => setSearchTerm('')}
      />

      <ProductDetailsView
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
