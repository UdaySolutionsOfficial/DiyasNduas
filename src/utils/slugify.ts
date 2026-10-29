/**
 * Ecommerce URL Slug & Product Share Utilities
 * Generates clean, SEO-friendly Flipkart / Amazon / Meesho-style product links.
 */

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-alphanumeric/non-dash chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function getProductSlug(product: { id: string; name: string; slug?: string }): string {
  if (product.slug && product.slug.trim()) {
    return product.slug.trim();
  }
  const nameSlug = slugify(product.name);
  return nameSlug || product.id;
}

export function getProductUrl(
  product: { id: string; name: string; slug?: string },
  customOrigin?: string
): string {
  const base =
    customOrigin ||
    (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://diyasnduas.com');
  const slug = getProductSlug(product);
  return `${base}/p/${slug}`;
}

export async function copyProductLink(
  product: { id: string; name: string; slug?: string },
  onSuccess?: () => void
): Promise<boolean> {
  const url = getProductUrl(product);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      if (onSuccess) onSuccess();
      return true;
    }
  } catch (err) {
    console.warn('[copyProductLink] Clipboard API failed, using fallback:', err);
  }

  // Fallback for older browsers
  try {
    const input = document.createElement('textarea');
    input.value = url;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(input);
    if (successful && onSuccess) onSuccess();
    return successful;
  } catch (e) {
    console.error('[copyProductLink] Fallback copy failed:', e);
    return false;
  }
}

export async function shareProduct(
  product: { id: string; name: string; sellingPrice?: number; slug?: string }
): Promise<'shared' | 'copied' | 'failed'> {
  const url = getProductUrl(product);
  const title = `${product.name} | Diyas N Duas`;
  const text = product.sellingPrice
    ? `Check out ${product.name} for ₹${product.sellingPrice} at Diyas N Duas! Handcrafted festive diyas delivered directly to your doorstep:`
    : `Check out ${product.name} at Diyas N Duas! Handcrafted festive diyas:`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return 'shared';
    } catch (err: any) {
      // User cancelled or share dismissed
      if (err.name === 'AbortError') return 'failed';
    }
  }

  // If navigator.share unavailable or fallback needed, copy to clipboard
  const copied = await copyProductLink(product);
  return copied ? 'copied' : 'failed';
}

export function getWhatsAppProductShareUrl(
  product: { id: string; name: string; sellingPrice?: number; slug?: string }
): string {
  const url = getProductUrl(product);
  const priceText = product.sellingPrice ? ` at only ₹${product.sellingPrice}` : '';
  const message = `Namaste! 🪔✨ Check out this beautiful handcrafted *${product.name}*${priceText} from Diyas N Duas:\n\n${url}\n\nFast India-wide home delivery!`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
