import React, { useState } from 'react';
import { Coupon, CouponDiscountType } from '../../types/coupon';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { TicketPercent, Percent, IndianRupee } from 'lucide-react';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
  onSave: (couponData: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
}

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  coupon,
  onSave,
}) => {
  const [code, setCode] = useState(coupon?.code || '');
  const [description, setDescription] = useState(coupon?.description || '');
  const [discountType, setDiscountType] = useState<CouponDiscountType>(coupon?.discountType || 'percentage');
  const [discountValue, setDiscountValue] = useState<number>(coupon?.discountValue || 10);
  const [minOrderValue, setMinOrderValue] = useState<number>(coupon?.minOrderValue || 0);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(coupon?.maxDiscount);
  const [isActive, setIsActive] = useState<boolean>(coupon?.isActive !== undefined ? coupon.isActive : true);
  
  // Format expiry date for <input type="date" />
  const [expiryDateString, setExpiryDateString] = useState<string>(() => {
    if (!coupon?.expiresAt) return '';
    const date = new Date(coupon.expiresAt);
    return date.toISOString().split('T')[0];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setDescription(coupon.description || '');
      setDiscountType(coupon.discountType);
      setDiscountValue(coupon.discountValue);
      setMinOrderValue(coupon.minOrderValue || 0);
      setMaxDiscount(coupon.maxDiscount);
      setIsActive(coupon.isActive);
      setExpiryDateString(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '');
    } else {
      setCode('');
      setDescription('');
      setDiscountType('percentage');
      setDiscountValue(10);
      setMinOrderValue(0);
      setMaxDiscount(undefined);
      setIsActive(true);
      setExpiryDateString('');
    }
    setError(null);
  }, [coupon, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Coupon code cannot be empty.');
      return;
    }

    if (discountValue <= 0) {
      setError('Discount value must be greater than 0.');
      return;
    }

    if (discountType === 'percentage' && discountValue > 100) {
      setError('Percentage discount cannot exceed 100%.');
      return;
    }

    let expiresAt: number | null = null;
    if (expiryDateString) {
      // Set to 23:59:59 on the selected date
      const d = new Date(expiryDateString);
      d.setHours(23, 59, 59, 999);
      expiresAt = d.getTime();
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        id: coupon?.id || cleanCode,
        code: cleanCode,
        description: description.trim(),
        discountType,
        discountValue,
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
        isActive,
        expiresAt,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={coupon ? `Edit Coupon: ${coupon.code}` : 'Create New Promo Coupon'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <Input
            label="Coupon Code *"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. FESTIVE20, DIWALI100"
            leftIcon={<TicketPercent className="w-4 h-4 text-brand-500" />}
            disabled={Boolean(coupon)} // Keep document ID stable when editing
            helperText="Uppercase alphanumeric letters (e.g. DIWALI10, SAVE150)"
          />
        </div>

        <Input
          label="Coupon Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Special festive 10% discount on orders above ₹500"
        />

        {/* Discount Type Radio / Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Discount Calculation Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDiscountType('percentage')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                discountType === 'percentage'
                  ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-600 dark:text-brand-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Percentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setDiscountType('fixed')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                discountType === 'fixed'
                  ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-600 dark:text-brand-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <IndianRupee className="w-4 h-4" />
              <span>Fixed Cash (₹)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            label={discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            placeholder={discountType === 'percentage' ? '10' : '100'}
            min={1}
            max={discountType === 'percentage' ? 100 : 100000}
          />

          {discountType === 'percentage' && (
            <Input
              type="number"
              label="Maximum Discount Cap (₹ Optional)"
              value={maxDiscount !== undefined ? maxDiscount : ''}
              onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 500"
              helperText="Leave empty for unlimited percentage discount"
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            label="Minimum Cart Value (₹)"
            value={minOrderValue}
            onChange={(e) => setMinOrderValue(Number(e.target.value))}
            placeholder="0"
            helperText="Minimum order subtotal needed to apply"
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expiry Date (Optional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={expiryDateString}
                onChange={(e) => setExpiryDateString(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Leave blank if coupon does not expire</p>
          </div>
        </div>

        {/* Coupon Active Toggle */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Toggle
            label="Coupon Enabled & Active"
            checked={isActive}
            onChange={setIsActive}
          />
          <span className="text-[11px] text-slate-500 block mt-1">
            Inactive coupons will immediately be rejected with an inactive notice on checkout.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={saving} className="font-bold">
            {coupon ? 'Save Changes' : 'Create Coupon'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
