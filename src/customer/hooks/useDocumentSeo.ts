import { useEffect } from 'react';

export interface SeoProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article' | 'product';
  noindex?: boolean;
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

/**
 * Lightweight client-side SEO manager
 * Safely updates document.title, canonical URL, meta description, and Open Graph tags on route changes
 * Zero dependencies, zero architectural mutations.
 */
export const useDocumentSeo = ({
  title,
  description,
  canonicalPath,
  ogImage,
  ogImageAlt,
  ogType = 'website',
  noindex = false,
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
  }, [title, description, canonicalPath, ogImage, ogImageAlt, ogType, noindex]);
};
