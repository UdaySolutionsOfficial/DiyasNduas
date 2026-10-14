/**
 * Common formatting helpers for Indian Rupee currency and timestamps.
 */

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatDiscountPercentage(original: number, selling: number): number {
  if (!original || original <= selling) return 0;
  return Math.round(((original - selling) / original) * 100);
}
