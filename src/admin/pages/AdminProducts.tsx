import React, { useEffect, useState, useMemo } from 'react';
import { productsService } from '../../services/products.service';
import { categoriesService } from '../../services/categories.service';
import { Product, ProductDraft } from '../../types/product';
import { Category } from '../../types/category';
import { ProductModal } from '../components/ProductModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Loading } from '../../components/ui/Loading';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { formatINR, formatDiscountPercentage } from '../../utils/formatters';
import { Plus, Edit2, Power, Trash2, FileSpreadsheet, Layers, MessageCircle, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { revenueExportService } from '../../services/revenueExport.service';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive' | 'low_stock' | 'featured'>('all');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete Confirmation Dialog State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const unsubscribeProducts = productsService.subscribeToProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    }, false);

    categoriesService.getAllCategories().then((cats) => {
      setCategories(cats);
    });

    return () => unsubscribeProducts();
  }, []);

  const handleSaveProduct = async (draft: ProductDraft, productId?: string) => {
    try {
      if (productId) {
        await productsService.updateProduct(productId, draft);
        toast.success('Product Updated', `"${draft.name}" updated successfully.`);
      } else {
        await productsService.createProduct(draft);
        toast.success('Product Created', `"${draft.name}" created successfully.`);
      }
    } catch (err) {
      console.error('[Save Product Error]', err);
      toast.error('Save Failed', 'Could not save product.');
    }
  };

    const handleTogglePreOrder = async (prod: Product) => {
    try {
      const nextValue = !prod.allowPreOrder;
      await productsService.updateProduct(prod.id, { allowPreOrder: nextValue });
      toast.success(
        nextValue ? 'Pre-Orders Enabled' : 'Switched to WhatsApp Inquiries',
        `"${prod.name}" out-of-stock mode: ${nextValue ? 'Customers can Pre-Order online' : '"I\'m Interested" WhatsApp inquiries'}`
      );
    } catch (err) {
      console.error('[Toggle Pre-Order]', err);
      toast.error('Update Failed', 'Could not update pre-order settings.');
    }
  };

  const handleToggleActive = async (prod: Product) => {
    try {
      await productsService.updateProduct(prod.id, { isActive: !prod.isActive });
      toast.info(
        prod.isActive ? 'Product Deactivated' : 'Product Activated',
        `"${prod.name}" status updated.`
      );
    } catch (err) {
      console.error('[Toggle Active]', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await productsService.deleteProduct(productToDelete.id);
      toast.success('Product Deleted', `"${productToDelete.name}" permanently deleted.`);
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('[Delete Product Error]', err);
      toast.error('Delete Failed', 'Could not delete product.');
    }
  };

  // Only real categories created and active in Category Management
  const categoryOptions = useMemo(() => {
    return categories
      .filter((c) => c.isActive !== false)
      .map((c) => ({ id: c.id, name: c.name }));
  }, [categories]);

  // Search & Filter Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory !== 'all') {
      const selectedOption = categoryOptions.find((c) => c.id === selectedCategory);
      const matchesCategory =
        p.categoryId === selectedCategory ||
        p.categoryName === selectedCategory ||
        (selectedOption && p.categoryName?.trim().toLowerCase() === selectedOption.name.trim().toLowerCase());
      if (!matchesCategory) return false;
    }

    if (filterTab === 'active') return p.isActive;
    if (filterTab === 'inactive') return !p.isActive;
    if (filterTab === 'low_stock') return p.isActive && p.stockQuantity <= 10;
    if (filterTab === 'featured') return p.isFeatured;
    return true;
  });

  if (loading) {
    return <Loading message="Loading product catalog..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Product Catalog Management</h1>
          <p className="text-sm text-slate-500">Manage products, stock levels, selling prices, and discounts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => revenueExportService.exportProductsCatalog(products)}
            variant="secondary"
            size="md"
            className="font-bold inline-flex items-center gap-1.5"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
          >
            <span>Export Catalog ({products.length})</span>
          </Button>

          <Button
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            variant="primary"
            size="md"
            className="font-bold inline-flex items-center gap-1.5"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            <span>Add New Product</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <Card glass className="p-4">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <SearchInput
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              className="w-full sm:max-w-xs"
            />

            {/* Category Dropdown Filter */}
            <div className="relative min-w-[210px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-500">
                <Layers className="w-4 h-4" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs cursor-pointer transition-all appearance-none"
              >
                <option value="all">All Categories ({products.length})</option>
                {categoryOptions.map((cat) => {
                  const count = products.filter(
                    (p) => p.categoryId === cat.id || p.categoryName?.trim().toLowerCase() === cat.name.trim().toLowerCase()
                  ).length;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({count})
                    </option>
                  );
                })}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Pills Container without Scrollbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' },
              { id: 'low_stock', label: 'Low Stock' },
              { id: 'featured', label: 'Featured' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterTab === tab.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Product List Grid / Cards */}
      {filteredProducts.length === 0 ? (
        <Card glass className="p-8 text-center space-y-2">
          <p className="text-slate-500 dark:text-slate-400 font-bold">No products match your filters.</p>
          <p className="text-xs text-slate-400">Try adjusting your search query, category, or status filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const discountPercent = formatDiscountPercentage(product.originalPrice, product.sellingPrice);
          const isOutOfStock = product.stockQuantity <= 0;

          return (
            <Card
              key={product.id}
              glass
              className={`p-4 flex flex-col justify-between rounded-2xl border ${
                !product.isActive ? 'opacity-60 bg-slate-100/50 dark:bg-slate-900/30' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-800">
                    <img
                      src={product.images?.[0] || ''}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest block truncate">
                        {product.categoryName}
                      </span>
                      {!product.isActive && <Badge variant="neutral">Inactive</Badge>}
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                </div>

                {/* Price & Stock Section */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-base">
                        {formatINR(product.sellingPrice)}
                      </span>
                      {product.originalPrice > product.sellingPrice && (
                        <span className="text-slate-400 line-through font-medium">
                          {formatINR(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    {discountPercent > 0 && (
                      <span className="font-extrabold text-rose-500 text-[11px]">{discountPercent}% OFF</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Current Stock:</span>
                    <span
                      className={`font-black ${
                        isOutOfStock
                          ? 'text-rose-500'
                          : product.stockQuantity <= 10
                          ? 'text-amber-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {product.stockQuantity} units
                    </span>
                  </div>

                  {/* Admin Only Actual Cost & Margin Display */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Actual Cost:</span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {product.actualCost && product.actualCost > 0 ? (
                        <span>
                          {formatINR(product.actualCost)}
                          <span className={`ml-1.5 text-[10px] font-black ${product.sellingPrice - product.actualCost >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            (+{formatINR(product.sellingPrice - product.actualCost)} margin)
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium italic text-[11px]">Not set</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Out-of-Stock Mode Switcher: Left[OFF] = WhatsApp Interest <-> Right[ON] = Pre-Orders */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  product.allowPreOrder
                    ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/80 dark:bg-amber-950/20'
                    : 'bg-emerald-50/70 border-emerald-200 dark:border-emerald-800/60 dark:bg-emerald-950/20'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {product.allowPreOrder ? (
                          <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse flex-shrink-0" />
                            <span>Pre-Orders: <strong className="font-black text-amber-600 dark:text-amber-400">ENABLED</strong></span>
                          </span>
                        ) : (
                          <span className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span>Out-of-Stock: <strong className="font-black text-emerald-600 dark:text-emerald-400">WHATSAPP</strong></span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
                        {product.allowPreOrder
                          ? 'When out of stock: Customers can Pre-Book online'
                          : 'When out of stock: "I\'m Interested" WhatsApp inquiries'}
                      </p>
                    </div>

                    {/* Interactive Toggle Switch: Left[OFF] WhatsApp <-> Right[ON] Pre-Orders */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(product.allowPreOrder)}
                      onClick={() => handleTogglePreOrder(product)}
                      className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-inner select-none ${
                        product.allowPreOrder
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 focus:ring-amber-500'
                          : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                      }`}
                      title={product.allowPreOrder ? 'Click to switch to WhatsApp inquiries when out of stock' : 'Click to allow customer Pre-Orders when out of stock'}
                    >
                      <span className="sr-only">Toggle Pre-Orders</span>
                      <span
                        className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                          product.allowPreOrder ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      >
                        {product.allowPreOrder ? (
                          <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                        ) : (
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Actions (Edit, Power, Delete) - Inline [Icon] Text Alignment */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 font-bold text-xs inline-flex flex-row items-center justify-center gap-1.5"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  <span>Edit</span>
                </Button>

                <Button
                  size="sm"
                  variant={product.isActive ? 'ghost' : 'outline'}
                  onClick={() => handleToggleActive(product)}
                  className={`px-2.5 inline-flex items-center justify-center ${product.isActive ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-600'}`}
                  title={product.isActive ? 'Deactivate Product' : 'Activate Product'}
                >
                  <Power className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setProductToDelete(product);
                    setShowDeleteDialog(true);
                  }}
                  className="px-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center justify-center"
                  title="Delete Product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* Product Edit / Create Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
        categories={categories}
      />

      {/* Delete Product Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action will permanently remove this item from your store catalog.`}
        confirmText="Delete Product"
        isDestructive
      />
    </div>
  );
};
