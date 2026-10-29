import { useEffect } from 'react';

export interface SeoProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article' | 'product';
  noindex?: boolean;
  productData?: {
    name: string;
    price: number;
    originalPrice?: number;
    inStock: boolean;
    sku?: string;
    category?: string;
    images?: string[];
  };
}

const DEFAULT_TITLE = 'Diyas N Duas — Handcrafted Festive Diyas & Sacred Essentials';
const DEFAULT_DESC =
  'Shop handcrafted festive diyas, terracotta clay lamps, brass deepams, and sacred essentials at Diyas N Duas. Direct safe delivery across India for Diwali and home prayers.';
const BASE_URL = 'https://diyasnduas.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-home.jpg`;
const DEFAULT_OG_ALT = 'Diyas N Duas — Handcrafted Festive Diyas and Sacred Essentials';

function updateMetaTag(selector: string, attr: string, value: string) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    const [attrName, attrVal] = selector.replace(/[[\]"]/g, '').split('=');
    if (attrName && attrVal) {
      element.setAttribute(attrName, attrVal);
      document.head.appendChild(element);
    }
  }
  element.setAttribute(attr, value);
}

function updateLinkTag(rel: string, href: string) {
  let link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function updateJsonLd(id: string, data: Record<string, any> | null) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!data) {
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/**
 * Enhanced client-side SEO manager with Schema.org E-Commerce Rich Snippets
 * Safely updates document.title, canonical URL, meta description, Open Graph, and Product JSON-LD on route changes.
 */
export const useDocumentSeo = ({
  title,
  description,
  canonicalPath,
  ogImage,
  ogImageAlt,
  ogType = 'website',
  noindex = false,
  productData,
}: SeoProps) => {
  useEffect(() => {
    // 1. Page Title
    const finalTitle = title ? `${title} | Diyas N Duas` : DEFAULT_TITLE;
    document.title = finalTitle;

    // 2. Meta Description
    const finalDesc = description || DEFAULT_DESC;
    updateMetaTag('meta[name="description"]', 'content', finalDesc);

    // 3. Robots Directives
    if (noindex) {
      updateMetaTag('meta[name="robots"]', 'content', 'noindex, nofollow');
    } else {
      updateMetaTag(
        'meta[name="robots"]',
        'content',
        'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      );
    }

    // 4. Canonical URL
    const cleanPath = canonicalPath !== undefined ? canonicalPath : window.location.pathname;
    const finalCanonical = `${BASE_URL}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
    updateLinkTag('canonical', finalCanonical);

    // 5. Open Graph Meta Tags
    const finalOgImage = ogImage || DEFAULT_OG_IMAGE;
    const finalOgAlt = ogImageAlt || DEFAULT_OG_ALT;

    updateMetaTag('meta[property="og:title"]', 'content', finalTitle);
    updateMetaTag('meta[property="og:description"]', 'content', finalDesc);
    updateMetaTag('meta[property="og:url"]', 'content', finalCanonical);
    updateMetaTag('meta[property="og:image"]', 'content', finalOgImage);
    updateMetaTag('meta[property="og:image:secure_url"]', 'content', finalOgImage);
    updateMetaTag('meta[property="og:image:alt"]', 'content', finalOgAlt);
    updateMetaTag('meta[property="og:type"]', 'content', ogType);

    // 6. Twitter / X Meta Tags
    updateMetaTag('meta[name="twitter:title"]', 'content', finalTitle);
    updateMetaTag('meta[name="twitter:description"]', 'content', finalDesc);
    updateMetaTag('meta[name="twitter:url"]', 'content', finalCanonical);
    updateMetaTag('meta[name="twitter:image"]', 'content', finalOgImage);
    updateMetaTag('meta[name="twitter:image:alt"]', 'content', finalOgAlt);

    // 7. Product-Specific OpenGraph & Schema.org JSON-LD (E-Commerce Rich Snippets)
    if (productData) {
      updateMetaTag('meta[property="product:price:amount"]', 'content', productData.price.toString());
      updateMetaTag('meta[property="product:price:currency"]', 'content', 'INR');
      updateMetaTag(
        'meta[property="product:availability"]',
        'content',
        productData.inStock ? 'in stock' : 'preorder'
      );

      const jsonLdData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: productData.name,
        image: productData.images && productData.images.length > 0 ? productData.images : [finalOgImage],
        description: finalDesc,
        sku: productData.sku || productData.name.toLowerCase().replace(/\s+/g, '-'),
        brand: {
          '@type': 'Brand',
          name: 'Diyas N Duas',
        },
        offers: {
          '@type': 'Offer',
          url: finalCanonical,
          priceCurrency: 'INR',
          price: productData.price,
          priceValidUntil: '2027-12-31',
          availability: productData.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/PreOrder',
          itemCondition: 'https://schema.org/NewCondition',
        },
      };
      updateJsonLd('dnd-product-jsonld', jsonLdData);
    } else {
      updateJsonLd('dnd-product-jsonld', null);
    }

    return () => {
      // Clean up product-specific tags on unmount
      if (productData) {
        updateJsonLd('dnd-product-jsonld', null);
      }
    };
  }, [
    title,
    description,
    canonicalPath,
    ogImage,
    ogImageAlt,
    ogType,
    noindex,
    productData?.name,
    productData?.price,
    productData?.inStock,
  ]);
};
