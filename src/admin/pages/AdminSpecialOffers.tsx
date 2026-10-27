import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { specialOffersService } from '../../services/specialOffers.service';
import { productsService } from '../../services/products.service';
import { SpecialOfferConfig, SpecialOfferProduct } from '../../types/specialOffer';
import { Product } from '../../types/product';
import { formatINR, formatDiscountPercentage } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { compressImageFile } from '../../utils/imageCompressor';
import { 
  Sparkles, 
  Gift, 
  Trash2, 
  Plus, 
  Save, 
  Upload, 
  Eye
} from 'lucide-react';

export const AdminSpecialOffers: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Config State
  const [config, setConfig] = useState<SpecialOfferConfig>(() => specialOffersService.getCachedSpecialOffers());

  // Add Product Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [offerPriceInput, setOfferPriceInput] = useState<number | ''>('');
  const [bannerUrlInput, setBannerUrlInput] = useState<string>('');

  useEffect(() => {
    Promise.all([
      specialOffersService.getSpecialOffersConfig(),
      productsService.getAllProducts(false),
    ]).then(([conf, prods]) => {
      setConfig(conf);
      setProducts(prods);
      setBannerUrlInput(conf.bannerUrl || '');
      setLoading(false);
    });
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImageFile(file, 1200, 400, 0.8);
      setConfig((prev) => ({ ...prev, bannerUrl: compressedBase64 }));
      setBannerUrlInput(compressedBase64);
      toast.success('Banner Uploaded', 'Promotional offer banner ready for preview.');
    } catch (err) {
      console.error('[Banner Upload]', err);
      toast.error('Upload Failed', 'Could not compress image file.');
    }
  };

  const handleAddProductToOffer = () => {
    if (!selectedProduct) {
      toast.warning('Select Product', 'Please select a product from your catalog.');
      return;
    }

    if (!offerPriceInput || Number(offerPriceInput) <= 0) {
      toast.warning('Invalid Price', 'Please enter a valid special offer price in ₹.');
      return;
    }

    const offerPrice = Number(offerPriceInput);
    if (offerPrice >= selectedProduct.sellingPrice) {
      toast.warning(
        'Price Check',
        `Special offer price (₹${offerPrice}) should be less than regular selling price (₹${selectedProduct.sellingPrice}) for clearance effect.`
      );
    }

    // Check if already in list
    const existingIndex = config.products.findIndex((p) => p.productId === selectedProduct.id);
    const offerItem: SpecialOfferProduct = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.images?.[0] || '',
      categoryName: selectedProduct.categoryName,
      originalPrice: selectedProduct.originalPrice,
      sellingPrice: selectedProduct.sellingPrice,
      offerPrice,
      stockQuantity: selectedProduct.stockQuantity,
    };

    if (existingIndex > -1) {
      const updated = [...config.products];
      updated[existingIndex] = offerItem;
      setConfig((prev) => ({ ...prev, products: updated }));
      toast.info('Offer Updated', `Updated special price for "${selectedProduct.name}".`);
    } else {
      setConfig((prev) => ({ ...prev, products: [...prev.products, offerItem] }));
      toast.success('Product Added', `Added "${selectedProduct.name}" to the milestone offer list.`);
    }

    setSelectedProductId('');
    setOfferPriceInput('');
  };

  const handleRemoveProductFromOffer = (productId: string) => {
    setConfig((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productId !== productId),
    }));
    toast.info('Item Removed', 'Product removed from special offer list.');
  };

  const handleSaveConfig = async () => {
    if (config.enabled && config.products.length === 0) {
      toast.warning('No Products Added', 'Please add at least one special offer product before enabling the campaign.');
      return;
    }

    try {
      setSaving(true);
      await specialOffersService.updateSpecialOffersConfig({
        ...config,
        bannerUrl: bannerUrlInput.trim(),
        minCartThreshold: Math.max(1, Number(config.minCartThreshold) || 700),
      });
      toast.success('Changes Saved! 🎉', 'Cart milestone special offers updated and live.');
    } catch (err) {
      console.error('[Save Special Offers]', err);
      toast.error('Save Failed', 'Could not save special offer configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading message="Loading special offers configuration..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Gift className="w-6 h-6 text-amber-500" />
              <span>Cart Milestone Special Offers</span>
            </h1>
            <Badge variant={config.enabled ? 'success' : 'neutral'}>
              {config.enabled ? 'Campaign Live' : 'Campaign Paused'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Set an order threshold (e.g. ₹700) to unlock clearance items at exclusive discounted prices in a celebratory popup.
          </p>
        </div>

        <Button
          onClick={handleSaveConfig}
          isLoading={saving}
          variant="primary"
          size="md"
          className="font-bold flex items-center gap-2 shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </Button>
      </div>

      {/* Main Campaign Settings Card */}
      <Card glass className="p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Campaign Master Toggle
            </h3>
            <p className="text-xs text-slate-500">
              When turned ON, shoppers whose cart subtotal reaches the threshold will see the celebratory offer popup.
            </p>
          </div>
          <Toggle
            label={config.enabled ? 'Enabled (Popup Active)' : 'Disabled (Paused)'}
            checked={config.enabled}
            onChange={(val) => setConfig((prev) => ({ ...prev, enabled: val }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Minimum Cart Value Threshold (₹) *"
            type="number"
            min={1}
            value={config.minCartThreshold}
            onChange={(e) => setConfig((prev) => ({ ...prev, minCartThreshold: Number(e.target.value) }))}
            helperText="The popup triggers when customer's cart reaches this amount (e.g. 700)."
          />

          <Input
            label="Celebratory Popup Title *"
            value={config.title}
            onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. 🎉 Milestone Unlocked! Special Festive Deals"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Offer Description / Subtitle
          </label>
          <textarea
            rows={2}
            value={config.subtitle}
            onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Explain the offer value to the customer..."
          />
        </div>

        {/* Banner Image Section */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Promotional Offer Banner Image (Optional)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Input
              value={bannerUrlInput}
              onChange={(e) => {
                setBannerUrlInput(e.target.value);
                setConfig((prev) => ({ ...prev, bannerUrl: e.target.value }));
              }}
              placeholder="Paste banner image URL or upload below..."
              className="flex-1"
            />
            <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer transition-colors flex-shrink-0">
              <Upload className="w-4 h-4 text-brand-500" />
              <span>Upload Banner</span>
              <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            </label>
          </div>

          {bannerUrlInput && (
            <div className="mt-2 rounded-2xl overflow-hidden max-h-48 border border-slate-200 dark:border-slate-800 bg-slate-950">
              <img src={bannerUrlInput} alt="Banner Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </Card>

      {/* Add Products to Milestone Offer Card */}
      <Card glass className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Select Clearance Products to Offer</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pick slow-moving items from your inventory and set an irresistible subsidized offer price.
            </p>
          </div>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
            {config.products.length} Items Configured
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          {/* Product Select Dropdown */}
          <div className="sm:col-span-6 space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Product from Catalog *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const found = products.find((p) => p.id === e.target.value);
                if (found) {
                  // Default suggested offer price: 40% off regular selling price
                  setOfferPriceInput(Math.round(found.sellingPrice * 0.6));
                }
              }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs cursor-pointer"
            >
              <option value="">-- Choose a Product ({products.length} available) --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — Current: ₹{p.sellingPrice} (Stock: {p.stockQuantity})
                </option>
              ))}
            </select>
          </div>

          {/* Product Price Info Pill */}
          {selectedProduct && (
            <div className="sm:col-span-2 text-xs p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block font-medium">Regular Price</span>
              <span className="font-black text-slate-900 dark:text-slate-100">
                {formatINR(selectedProduct.sellingPrice)}
              </span>
            </div>
          )}

          {/* Special Offer Price Input */}
          <div className={`${selectedProduct ? 'sm:col-span-2' : 'sm:col-span-4'} space-y-1`}>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Special Offer Price (₹) *
            </label>
            <input
              type="number"
              min={1}
              value={offerPriceInput}
              onChange={(e) => setOfferPriceInput(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 199"
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
          </div>

          {/* Add Button */}
          <div className="sm:col-span-2">
            <Button
              type="button"
              onClick={handleAddProductToOffer}
              variant="primary"
              size="sm"
              className="w-full font-bold text-xs py-2 inline-flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Offer</span>
            </Button>
          </div>
        </div>

        {/* Configured Offer Items Table / Grid */}
        {config.products.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Gift className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              No products added to milestone offers yet.
            </p>
            <p className="text-xs text-slate-400">
              Select an item above, set its special offer price, and click "Add Offer".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {config.products.map((item) => {
              const discountPercent = formatDiscountPercentage(item.sellingPrice, item.offerPrice);
              return (
                <div
                  key={item.productId}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.productImage || '/logo.png'}
                      alt={item.productName}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block truncate">
                        {item.categoryName || 'Diya Special'}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {item.productName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400 line-through">
                          {formatINR(item.sellingPrice)}
                        </span>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                          {formatINR(item.offerPrice)}
                        </span>
                        {discountPercent > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveProductFromOffer(item.productId)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0 cursor-pointer"
                    title="Remove item from offer list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Live Customer Popup Preview */}
      <Card glass className="p-5 space-y-3 border-amber-300/60 dark:border-amber-700/60 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Live Customer Popup Preview
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Triggers at cart subtotal ≥ ₹{config.minCartThreshold}
          </span>
        </div>

        {/* Mock Popup Simulation */}
        <div className="max-w-md mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3">
          {config.bannerUrl ? (
            <div className="rounded-2xl overflow-hidden max-h-36 bg-slate-950">
              <img src={config.bannerUrl} alt="Offer Banner" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-brand-500 to-amber-600 text-white text-center">
              <Sparkles className="w-6 h-6 mx-auto mb-1 animate-pulse" />
              <h4 className="font-black text-sm tracking-tight">{config.title || 'Cart Milestone Offer'}</h4>
              <p className="text-[11px] opacity-90 mt-0.5">{config.subtitle}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="text-slate-600 dark:text-slate-300">Unlocked Milestone Items:</span>
            <span className="text-amber-600 dark:text-amber-400 font-black">
              Cart ≥ ₹{config.minCartThreshold}
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {config.products.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Add products above to see them in this preview.</p>
            ) : (
              config.products.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={item.productImage || '/logo.png'} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="font-bold truncate">{item.productName}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-slate-400 line-through">{formatINR(item.sellingPrice)}</span>
                        <span className="font-black text-amber-600 dark:text-amber-400">{formatINR(item.offerPrice)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    disabled
                    type="button"
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black flex items-center gap-1 flex-shrink-0 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Claim</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
