import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsService } from '../../services/products.service';
import { Product } from '../../types/product';
import { ProductDetailsView } from '../components/ProductDetailsView';
import { Loading } from '../../components/ui/Loading';
import { ErrorState } from '../../components/ui/ErrorState';
import { useDocumentSeo } from '../hooks/useDocumentSeo';
import { getProductSlug } from '../../utils/slugify';
import { ROUTES } from '../../constants/routes';
import { ChevronRight, Home, Grid } from 'lucide-react';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(() => {
    if (!id) return null;
    const clean = decodeURIComponent(id).trim();
    const cached = productsService.getCachedProducts(false);
    return cached.find(p => p.id === clean || (p.slug && p.slug === clean) || p.name === clean) || null;
  });
  const [loading, setLoading] = useState(() => !product);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchProd = async () => {
      setLoading(true);
      try {
        const found = await productsService.getProductBySlugOrId(id);
        if (isMounted) {
          setProduct(found);
        }
      } catch (err) {
        console.error('[ProductDetails] Fetch failed:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchProd();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const slug = product ? getProductSlug(product) : '';

  useDocumentSeo({
    title: product ? `${product.name} — Handcrafted Festive Diya` : 'Festive Diya Details',
    description: product
      ? (product.description || `Buy ${product.name} at ₹${product.sellingPrice} from Diyas N Duas. Direct safe delivery across India for Diwali and home prayers.`).slice(0, 160)
      : undefined,
    canonicalPath: product ? `/p/${slug}` : undefined,
    ogImage: product?.images?.[0],
    ogImageAlt: product ? `${product.name} - Diyas N Duas` : undefined,
    ogType: 'product',
    productData: product
      ? {
          name: product.name,
          price: product.sellingPrice,
          originalPrice: product.originalPrice,
          inStock: product.stockQuantity > 0,
          category: product.categoryName,
          images: product.images,
        }
      : undefined,
  });

  if (loading) {
    return (
      <div className="py-20">
        <Loading message="Loading diya details..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12">
        <ErrorState
          title="Product Not Found"
          message="The requested diya item could not be found or the link may have expired."
          onRetry={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
          retryText="Browse All Diyas"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Ecommerce Breadcrumb Navigation Bar */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto py-1 whitespace-nowrap">
        <Link to={ROUTES.CUSTOMER.HOME} className="hover:text-brand-600 transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <Link to={ROUTES.CUSTOMER.PRODUCTS} className="hover:text-brand-600 transition-colors flex items-center gap-1">
          <Grid className="w-3.5 h-3.5" />
          <span>Catalog</span>
        </Link>
        {product.categoryName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            <Link
              to={`${ROUTES.CUSTOMER.PRODUCTS}?category=${product.categoryId}`}
              className="hover:text-brand-600 transition-colors"
            >
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Full Dedicated Product View */}
      <ProductDetailsView
        product={product}
        onClose={() => {
          navigate(ROUTES.CUSTOMER.PRODUCTS);
        }}
      />
    </div>
  );
};
