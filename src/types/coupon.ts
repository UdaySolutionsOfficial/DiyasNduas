export type CouponDiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string; // Document ID (usually same as normalized uppercase code)
  code: string; // Uppercase unique code e.g. "DIWALI10", "FESTIVE50"
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 10 for 10% or 100 for ₹100
  minOrderValue?: number; // Minimum subtotal required to apply
  maxDiscount?: number; // Cap for percentage discount (e.g. max ₹500 off)
  isActive: boolean;
  expiresAt?: number | null; // Timestamp in ms or null/undefined for no expiry
  createdAt: number;
  updatedAt: number;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}
