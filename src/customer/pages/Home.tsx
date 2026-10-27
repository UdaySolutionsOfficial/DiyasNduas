import React, { useEffect, useState, useMemo } from 'react';
import { WelcomeExperience } from '../components/WelcomeExperience';
import { BannerCarousel } from '../components/BannerCarousel';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductSearch } from '../components/ProductSearch';
import { ProductGrid } from '../components/ProductGrid';
import { ProductDetailsView } from '../components/ProductDetailsView';
import { HorizontalProductShowcase } from '../components/HorizontalProductShowcase';
import { productsService } from '../../services/products.service';
import { settingsService } from '../../services/settings.service';
import { Product } from '../../types/product';
import { StoreSettings } from '../../types/settings';
import { Sparkles, ShieldCheck, Truck, PhoneCall, MapPin, MessageSquare, Clock, Mail, Instagram, Navigation, ExternalLink } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useDocumentSeo } from '../hooks/useDocumentSeo';

export const Home: React.FC = () => {
  useDocumentSeo({
    canonicalPath: '/',
    ogImage: 'https://diyasnduas.com/og-home.jpg',
    ogImageAlt: 'Diyas N Duas — Handcrafted Festive Diyas & Sacred Essentials',
    description: 'Shop handcrafted festive diyas, terracotta clay lamps, brass deepams, and sacred essentials at Diyas N Duas. Direct safe delivery across India.',
  });

  // 1. Welcome Experience State
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    return !sessionStorage.getItem('ck_welcome_seen');
  });

  const handleWelcomeComplete = () => {
    sessionStorage.setItem('ck_welcome_seen', 'true');
    setShowWelcome(false);
  };

  // 2. Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(() => settingsService.getCachedSettings());
  const [loading, setLoading] = useState(true);

  // 3. Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const unsubscribeProducts = productsService.subscribeToProducts((prodsData) => {
      setProducts(prodsData);
      setLoading(false);
      if (prodsData && prodsData.length > 0) {
        prodsData.slice(0, 8).forEach((p) => {
          if (p.images && p.images[0]) {
            const img = new Image();
            img.src = p.images[0];
          }
        });
      }
    }, true);

    const unsubscribeSettings = settingsService.subscribeToStoreSettings((settingsData) => {
      setSettings(settingsData);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSettings();
    };
  }, []);

  // Dynamic catalog price bounds
  const { catalogMinPrice, catalogMaxPrice } = useMemo(() => {
    if (!products.length) return { catalogMinPrice: 0, catalogMaxPrice: 2000 };
    const prices = products.map((p) => p.sellingPrice || 0);
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return { catalogMinPrice: min, catalogMaxPrice: max === min ? min + 1000 : max };
  }, [products]);

  const [filters, setFilters] = useState({
    categoryId: null as string | null,
    minPrice: 0,
    maxPrice: 999999,
    sortBy: 'featured' as 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'newest',
    inStockOnly: false,
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categoryId: selectedCategoryId,
      minPrice: prev.minPrice === 0 ? catalogMinPrice : Math.max(catalogMinPrice, prev.minPrice),
      maxPrice: prev.maxPrice === 999999 ? catalogMaxPrice : Math.min(catalogMaxPrice, prev.maxPrice),
    }));
  }, [catalogMinPrice, catalogMaxPrice, selectedCategoryId]);

  const isFilterActive = Boolean(
    searchTerm ||
    selectedCategoryId ||
    filters.minPrice > catalogMinPrice ||
    filters.maxPrice < catalogMaxPrice ||
    filters.sortBy !== 'featured' ||
    filters.inStockOnly
  );

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      // 1. Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Category
      if (selectedCategoryId && p.categoryId !== selectedCategoryId) {
        return false;
      }

      // 3. Price Filter (Dynamic Lowest to Highest)
      const price = p.sellingPrice || 0;
      if (price < filters.minPrice || price > filters.maxPrice) {
        return false;
      }

      // 4. In Stock Filter
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

  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.isFeatured && p.isActive);
  }, [products]);

  const handleSelectCategory = (catId: string | null) => {
    setSelectedCategoryId(catId);
    setFilters((prev) => ({ ...prev, categoryId: catId }));
  };

  const handleResetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId(null);
    setFilters({
      categoryId: null,
      minPrice: catalogMinPrice,
      maxPrice: catalogMaxPrice,
      sortBy: 'featured',
      inStockOnly: false,
    });
  };

  return (
    <>
      {showWelcome && <WelcomeExperience onComplete={handleWelcomeComplete} />}

      <div className="space-y-8 animate-fade-in pb-8 relative z-10">
        {/* Promotional Banners Carousel */}
        <BannerCarousel />

        {/* Semantic SEO Heading Block */}
        <header className="space-y-1 pt-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Handcrafted Festive Diyas &amp; Sacred Essentials
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Explore artisan terracotta clay lamps, brass deepams, and festive home decor handcrafted for sacred celebrations.
          </p>
        </header>

        {/* Search & Category Tabs (Clean Browsing on Home) */}
        <section className="space-y-4">
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
            showAdvancedFilter={false}
          />
        </section>

        {/* 3D Horizontal Showcase Carousel */}
        {!isFilterActive && (
          <HorizontalProductShowcase
            products={featuredProducts.length > 0 ? featuredProducts : products.slice(0, 6)}
            onSelectProduct={setSelectedProduct}
          />
        )}

        {/* Main Product Catalog Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              {searchTerm
                ? 'Search Results'
                : selectedCategoryId
                ? 'Category Products'
                : isFilterActive
                ? 'Filtered Diyas'
                : 'All Diyas Catalog'}
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {filteredProducts.length} items available
            </span>
          </div>

          <ProductGrid
            products={filteredProducts}
            loading={loading}
            onSelectProduct={setSelectedProduct}
            searchTerm={searchTerm}
            onResetFilters={handleResetAllFilters}
          />
        </section>

        {/* Value Proposition & Store Contact Section */}
        <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card glass className="flex items-center gap-4 p-4 rounded-3xl glass-card-3d">
              <div className="p-3 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Safe Order Request</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pay after phone confirmation</p>
              </div>
            </Card>

            <Card glass className="flex items-center gap-4 p-4 rounded-3xl glass-card-3d">
              <div className="p-3 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Fast Transport Delivery</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Direct Diyas N Duas packaging</p>
              </div>
            </Card>

            <Card glass className="flex items-center gap-4 p-4 rounded-3xl glass-card-3d">
              <div className="p-3 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Personal Assistance</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Direct store support call</p>
              </div>
            </Card>
          </div>

          {/* Store Info Footer Card */}
          {settings && (() => {
            const instagramUrl = settings.instagramUrl?.trim()
              ? (settings.instagramUrl.startsWith('http')
                  ? settings.instagramUrl
                  : `https://instagram.com/${settings.instagramUrl.replace(/^@/, '')}`)
              : 'https://instagram.com/diyasnduas';

            const instagramHandle = settings.instagramUrl?.trim()
              ? (settings.instagramUrl.includes('instagram.com/')
                  ? `@${settings.instagramUrl.split('instagram.com/')[1].split('/')[0].split('?')[0]}`
                  : settings.instagramUrl.startsWith('@')
                  ? settings.instagramUrl
                  : `@${settings.instagramUrl}`)
              : '@diyasnduas';

            return (
              <Card glass className="p-6 text-xs sm:text-sm space-y-4 rounded-3xl glass-card-3d border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                      {settings.storeName} — Official Store Info
                    </h3>
                  </div>

                  {/* Quick Social & Direct Contact Action Icons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={settings.mapDirectionsUrl || 'https://www.google.com/maps/dir/?api=1&destination=17.451073,78.409626'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                      title="Visit Store / Get GPS Directions"
                    >
                      <Navigation className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                      <span className="hidden sm:inline">Visit Store</span>
                      <span className="sm:hidden">Directions</span>
                    </a>

                    <a
                      href={`tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`}
                      className="p-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/80 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60 transition-all shadow-xs"
                      title={`Call: ${settings.contactPhone}`}
                      aria-label={`Call ${settings.contactPhone}`}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>

                    <a
                      href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 transition-all shadow-xs"
                      title={`Chat on WhatsApp: ${settings.whatsappNumber}`}
                      aria-label={`WhatsApp ${settings.whatsappNumber}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    <a
                      href={`mailto:${settings.storeEmail || 'udaysolutions.us@gmail.com'}`}
                      className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 transition-all shadow-xs"
                      title={`Send Email to ${settings.storeEmail || 'udaysolutions.us@gmail.com'}`}
                      aria-label={`Email ${settings.storeEmail || 'udaysolutions.us@gmail.com'}`}
                    >
                      <Mail className="w-4 h-4" />
                    </a>

                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/10 via-pink-500/10 to-purple-500/10 hover:from-amber-500/20 hover:via-pink-500/20 hover:to-purple-500/20 text-pink-600 dark:text-pink-400 border border-pink-200/60 dark:border-pink-800/60 transition-all shadow-xs"
                      title={`Follow on Instagram: ${instagramHandle}`}
                      aria-label={`Instagram ${instagramHandle}`}
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Informational Grid with Clickable Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-slate-600 dark:text-slate-300 font-medium">
                  {/* 1. Call */}
                  <a
                    href={`tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200/50 dark:border-slate-800 transition-colors group"
                  >
                    <PhoneCall className="w-4 h-4 text-brand-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{settings.contactPhone}</span>
                    </div>
                  </a>

                  {/* 2. WhatsApp */}
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/50 dark:border-slate-800 transition-colors group"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{settings.whatsappNumber}</span>
                    </div>
                  </a>

                  {/* 3. Email */}
                  <a
                    href={`mailto:${settings.storeEmail || 'udaysolutions.us@gmail.com'}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/50 dark:border-slate-800 transition-colors group"
                  >
                    <Mail className="w-4 h-4 text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{settings.storeEmail || 'udaysolutions.us@gmail.com'}</span>
                    </div>
                  </a>

                  {/* 4. Instagram */}
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-slate-200/50 dark:border-slate-800 transition-colors group"
                  >
                    <Instagram className="w-4 h-4 text-pink-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instagram</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{instagramHandle}</span>
                    </div>
                  </a>

                  {/* 5. Address / Directions */}
                  <a
                    href={settings.mapDirectionsUrl || 'https://www.google.com/maps/dir/?api=1&destination=17.451073,78.409626'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/50 dark:border-slate-800 transition-colors group"
                    title="Click for GPS Directions"
                  >
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location (Directions)</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{settings.storeAddress}</span>
                    </div>
                  </a>

                  {/* 6. Hours */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="truncate">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hours</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{settings.businessHours || 'Mon - Sun: 9AM - 9PM'}</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Embedded Google Maps Section */}
                <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center font-bold">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          Visit Our Offline Store in Borabanda, Hyderabad
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Experience our sacred brass lamps & handcrafted diyas in person. Walk-ins always welcome!
                        </p>
                      </div>
                    </div>
                    <a
                      href={settings.mapDirectionsUrl || 'https://www.google.com/maps/dir/?api=1&destination=17.451073,78.409626'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black shadow-xs transition-all active:scale-95 flex-shrink-0"
                    >
                      <Navigation className="w-3.5 h-3.5 text-rose-500" />
                      <span>Get GPS Directions</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>

                  {/* Responsive Iframe Container */}
                  <div className="relative w-full h-56 sm:h-72 md:h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-900">
                    <iframe
                      src={settings.mapEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d237.88628099032428!2d78.40962557790971!3d17.451073009805704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1791916843800!5m2!1sen!2sin'}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      title="Diyas N Duas Store Location Map"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </Card>
            );
          })()}
        </section>

        {/* Product Details Sheet / Modal */}
        <ProductDetailsView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </div>
    </>
  );
};
