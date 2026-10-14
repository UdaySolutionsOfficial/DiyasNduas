import React, { useEffect, useState } from 'react';
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
import { Plus, Edit2, Power, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
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

    categoriesService.getAllCategories(false).then((cats) => {
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

  // Search & Filter Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

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

      {/* Search & Filter Controls - No Horizontal Scrollbar */}
      <Card glass className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <SearchInput
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            className="w-full lg:max-w-xs"
          />

          {/* Filter Pills Container without Scrollbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Products' },
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
