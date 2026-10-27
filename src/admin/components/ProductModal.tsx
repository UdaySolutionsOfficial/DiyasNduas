import React, { useEffect, useState, useRef } from 'react';
import { Product, ProductDraft, ProductSection } from '../../types/product';
import { Category } from '../../types/category';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Toggle } from '../../components/ui/Toggle';
import { Button } from '../../components/ui/Button';
import { formatDiscountPercentage } from '../../utils/formatters';
import { Tag, Package, Image as ImageIcon, Upload, X, Star, Plus } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: ProductDraft, productId?: string) => Promise<void>;
  product?: Product | null;
  categories: Category[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [originalPrice, setOriginalPrice] = useState(500);
  const [sellingPrice, setSellingPrice] = useState(350);
  const [actualCost, setActualCost] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState(50);
  const [badge, setBadge] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowPreOrder, setAllowPreOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setSections(product.sections && Array.isArray(product.sections) ? [...product.sections] : []);
      setCategoryId(product.categoryId);
      setOriginalPrice(product.originalPrice);
      setSellingPrice(product.sellingPrice);
      setActualCost(product.actualCost !== undefined && product.actualCost > 0 ? product.actualCost : '');
      setStockQuantity(product.stockQuantity);
      setBadge(product.badge || '');
      setImages(product.images && product.images.length > 0 ? product.images : []);
      setIsActive(product.isActive);
      setIsFeatured(product.isFeatured);
      setAllowPreOrder(Boolean(product.allowPreOrder));
    } else {
      setName('');
      setDescription('');
      setSections([]);
      setCategoryId(categories[0]?.id || '');
      setOriginalPrice(500);
      setSellingPrice(350);
      setActualCost('');
      setStockQuantity(50);
      setBadge('');
      setImages([]);
      setIsActive(true);
      setIsFeatured(false);
      setAllowPreOrder(false);
    }
    setUrlInput('');
    setErrors({});
  }, [product, categories, isOpen]);

  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i], 800, 800, 0.75);
        compressedList.push(compressed);
      }
      setImages((prev) => [...prev, ...compressedList]);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, images: err.message || 'Image upload failed.' }));
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      setImages((prev) => [...prev, trimmed]);
      setUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  const calculatedDiscount = formatDiscountPercentage(originalPrice, sellingPrice);

  const handleAddSection = () => {
    setSections((prev) => [...prev, { title: '', content: '' }]);
  };

  const handleUpdateSection = (index: number, field: 'title' | 'content', value: string) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Please enter product name.';
    if (!categoryId) newErrors.categoryId = 'Please select a category.';
    if (originalPrice <= 0) newErrors.originalPrice = 'Enter a valid MRP price.';
    if (sellingPrice <= 0) newErrors.sellingPrice = 'Enter a valid selling price.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      const selectedCat = categories.find((c) => c.id === categoryId);
      const finalImages = images.length > 0 
        ? images 
        : ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'];

      const cleanedSections = sections
        .map((s) => ({
          title: s.title ? s.title.trim() : '',
          content: s.content ? s.content.trim() : '',
        }))
        .filter((s) => s.content.length > 0 || (s.title && s.title.length > 0));

      const draft: ProductDraft = {
        name: name.trim(),
        description: description.trim(),
        sections: cleanedSections.length > 0 ? cleanedSections : undefined,
        categoryId,
        categoryName: selectedCat?.name || '',
        originalPrice: Number(originalPrice),
        sellingPrice: Number(sellingPrice),
        actualCost: actualCost !== '' ? Number(actualCost) : 0,
        stockQuantity: Number(stockQuantity),
        images: finalImages,
        badge: badge.trim() || '',
        isActive,
        isFeatured,
        allowPreOrder,
      };

      await onSave(draft, product?.id);
      onClose();
    } catch (err: any) {
      console.error('[ProductModal]', err);
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Product Name *"
          placeholder="e.g. Handcrafted Brass Peacock Diya (Pack of 2)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          leftIcon={<Package className="w-4 h-4" />}
        />

        {categoryOptions.length > 0 && (
          <Select
            label="Category *"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            error={errors.categoryId}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="MRP Original Price (₹) *"
            type="number"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(Number(e.target.value))}
            error={errors.originalPrice}
          />
          <Input
            label="Store Selling Price (₹) *"
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Number(e.target.value))}
            error={errors.sellingPrice}
          />
          <Input
            label="Actual Cost (₹)"
            type="number"
            placeholder="e.g. 200 (Admin only)"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value === '' ? '' : Number(e.target.value))}
            helperText="Admin only — hidden from customers"
          />
        </div>

        {/* Automatic Discount & Profit Margin Insights Display */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Calculated Discount:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
              {calculatedDiscount}% OFF
            </span>
          </div>

          {actualCost !== '' && Number(actualCost) > 0 && (
            <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-1.5 sm:pt-0 sm:pl-3">
              <span className="text-slate-500">Estimated Unit Profit:</span>
              <span className={`font-mono font-black text-sm ${sellingPrice - Number(actualCost) >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}`}>
                ₹{sellingPrice - Number(actualCost)}
                <span className="text-[10px] font-bold ml-1 opacity-80">
                  ({Math.round(((sellingPrice - Number(actualCost)) / (sellingPrice || 1)) * 100)}% margin)
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Stock Quantity *"
            type="number"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(Number(e.target.value))}
          />
          <Input
            label="Product Badge (Optional)"
            placeholder="e.g. Bestseller, Special Offer"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            leftIcon={<Tag className="w-4 h-4" />}
          />
        </div>

        {/* Multiple Product Images Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Product Images Gallery ({images.length})
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs py-1 font-bold"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-brand-500" />
              <span>Upload Multiple Images</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMultipleFiles}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Or paste image URL and click Add"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1"
              leftIcon={<ImageIcon className="w-4 h-4" />}
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddUrl} className="font-bold">
              Add URL
            </Button>
          </div>

          {/* Multiple Image Preview Thumbnails Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 max-h-44 overflow-y-auto pr-1">
              {images.map((img, idx) => {
                const isPrimary = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`relative h-24 rounded-xl overflow-hidden border bg-slate-900 group shadow-sm ${
                      isPrimary ? 'border-amber-400 border-2 ring-2 ring-amber-400/20' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    
                    {/* Primary Badge */}
                    {isPrimary && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-slate-950" />
                        Main
                      </span>
                    )}

                    {/* Image Actions Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="p-1 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black hover:bg-amber-300"
                          title="Set as primary image"
                        >
                          Main
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                        title="Delete image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Multi-Paragraph Description Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <button
              type="button"
              onClick={handleAddSection}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 text-xs font-bold transition-all shadow-xs cursor-pointer group"
              title="Add another paragraph or section"
            >
              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-brand-500" />
              <span>Add Paragraph</span>
            </button>
          </div>

          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Main product details, material (brass/clay), dimensions..."
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
          />

          {/* Dynamic Additional Paragraphs */}
          {sections.map((sec, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-2 relative transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={sec.title || ''}
                  onChange={(e) => handleUpdateSection(idx, 'title', e.target.value)}
                  placeholder={`Paragraph ${idx + 2} Title (Optional, e.g. Where to Place, How to use)`}
                  className="flex-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSection(idx)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Remove this paragraph"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                rows={2}
                value={sec.content}
                onChange={(e) => handleUpdateSection(idx, 'content', e.target.value)}
                placeholder="Write paragraph content..."
                className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
          <Toggle label="Active Store Item" checked={isActive} onChange={setIsActive} />
          <Toggle label="Featured Item" checked={isFeatured} onChange={setIsFeatured} />
          <Toggle label="Allow Pre-Orders when Out of Stock" checked={allowPreOrder} onChange={setAllowPreOrder} />
        </div>

        <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={saving} className="font-bold">
            {product ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
