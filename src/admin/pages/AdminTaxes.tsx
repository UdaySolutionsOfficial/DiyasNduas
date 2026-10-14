import React, { useEffect, useState } from 'react';
import { couponService } from '../../services/coupon.service';
import { settingsService } from '../../services/settings.service';
import { Coupon } from '../../types/coupon';
import { StoreSettings } from '../../types/settings';
import { CouponModal } from '../components/CouponModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { Loading } from '../../components/ui/Loading';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { useToast } from '../../contexts/ToastContext';
import { formatINR } from '../../utils/formatters';
import { 
  Receipt, 
  Truck, 
  TicketPercent, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Percent,
  IndianRupee,
  Calendar,
  Clock
} from 'lucide-react';

export const AdminTaxes: React.FC = () => {
  const toast = useToast();

  // Settings State for Taxes and Delivery
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  // Load Settings
  useEffect(() => {
    const unsub = settingsService.subscribeToStoreSettings((data) => {
      setSettings(data);
      setSettingsLoading(false);
    });
    return () => unsub();
  }, []);

  // Load Coupons Realtime
  useEffect(() => {
    const unsub = couponService.subscribeToCoupons((couponList) => {
      setCoupons(couponList);
      setCouponsLoading(false);
    });
    return () => unsub();
  }, []);

  // Save Taxes & Delivery Settings
  const handleSaveTaxesAndDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSavingSettings(true);
      await settingsService.updateStoreSettings(settings);
      toast.success('Settings Saved', 'Taxes and delivery fee rules updated successfully.');
    } catch (err) {
      toast.error('Save Failed', 'Could not update taxes and delivery settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Coupon Handlers
  const handleSaveCoupon = async (couponData: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    try {
      await couponService.saveCoupon(couponData);
      toast.success(
        selectedCoupon ? 'Coupon Updated' : 'Coupon Created',
        `Coupon code "${couponData.code}" is ready to use.`
      );
      setIsCouponModalOpen(false);
    } catch (err: any) {
      toast.error('Operation Failed', err.message || 'Could not save coupon.');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const newState = !coupon.isActive;
      await couponService.toggleCouponActive(coupon.id, newState);
      toast.info(
        newState ? 'Coupon Activated' : 'Coupon Deactivated',
        `Coupon "${coupon.code}" is now ${newState ? 'active' : 'inactive'}.`
      );
    } catch (err) {
      toast.error('Error', 'Failed to toggle coupon status.');
    }
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      await couponService.deleteCoupon(couponToDelete.id);
      toast.success('Coupon Deleted', `Coupon "${couponToDelete.code}" deleted permanently.`);
      setCouponToDelete(null);
    } catch (err) {
      toast.error('Delete Failed', 'Could not delete coupon.');
    }
  };

  if (settingsLoading || couponsLoading || !settings) {
    return <Loading message="Loading taxes, delivery & coupon controls..." />;
  }

  const taxSettings = settings.taxSettings || {
    enabled: false,
    name: 'GST',
    rate: 5,
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-500" />
            <span>Taxes, Delivery & Coupons</span>
          </h1>
          <p className="text-sm text-slate-500">
            Full dynamic control over store GST/VAT taxes, free delivery thresholds, and promo discount coupons.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedCoupon(null);
            setIsCouponModalOpen(true);
          }}
          variant="primary"
          size="md"
          className="font-bold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Create Promo Coupon</span>
        </Button>
      </div>

      {/* Grid: Left Column (Taxes & Delivery Rules) | Right Column (Promo Coupons) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Taxes & Delivery Configuration (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSaveTaxesAndDelivery} className="space-y-6">
            {/* 1. Taxes (GST / VAT) Card */}
            <Card glass className="p-5 space-y-4 rounded-3xl">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Store Taxes (GST / VAT)</h3>
                  <p className="text-[11px] text-slate-500">Apply tax rate automatically at checkout</p>
                </div>
              </div>

              {/* Tax Enable Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Toggle
                  label="Enable Automatic Tax Calculation"
                  checked={taxSettings.enabled}
                  onChange={(val) =>
                    setSettings({
                      ...settings,
                      taxSettings: { ...taxSettings, enabled: val },
                    })
                  }
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  {taxSettings.enabled
                    ? 'Taxes are ACTIVE and will be computed on checkout.'
                    : 'Taxes are DISABLED. Customers will not be charged extra tax.'}
                </span>
              </div>

              {taxSettings.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in pt-1">
                  <Input
                    label="Tax Name / Label"
                    value={taxSettings.name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        taxSettings: { ...taxSettings, name: e.target.value },
                      })
                    }
                    placeholder="e.g. GST, VAT"
                    helperText="Displayed in customer bill breakdown"
                  />

                  <Input
                    type="number"
                    label="Tax Rate Percentage (%)"
                    value={taxSettings.rate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        taxSettings: { ...taxSettings, rate: Number(e.target.value) },
                      })
                    }
                    placeholder="e.g. 5, 12, 18"
                    min={0}
                    max={100}
                    helperText="Calculated on subtotal after discounts"
                  />
                </div>
              )}
            </Card>

            {/* 2. Delivery Rules & Threshold Card */}
            <Card glass className="p-5 space-y-4 rounded-3xl">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Delivery Charges & Rules</h3>
                  <p className="text-[11px] text-slate-500">Control shipping fees and free delivery threshold</p>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  type="number"
                  label="Free Delivery Threshold (₹)"
                  value={settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 1000}
                  onChange={(e) =>
                    setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })
                  }
                  placeholder="1000"
                  helperText="Orders equal to or above this value get ₹0 delivery fee."
                />

                <Input
                  type="number"
                  label="Standard Delivery Fee (₹)"
                  value={settings.defaultDeliveryFee !== undefined ? settings.defaultDeliveryFee : 80}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultDeliveryFee: Number(e.target.value) })
                  }
                  placeholder="80"
                  helperText="Delivery fee applied for orders below the threshold."
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={savingSettings}
                  className="w-full font-bold shadow-md shadow-brand-500/20"
                >
                  <Save className="w-4 h-4 mr-2" />
                  <span>Save Taxes & Delivery Rules</span>
                </Button>
              </div>
            </Card>
          </form>
        </div>

        {/* Right Column: Promotional Coupons List (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <Card glass className="p-5 space-y-4 rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <TicketPercent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Promo Discount Coupons ({coupons.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Create %, flat cash discounts, expiry dates, or deactivate anytime
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setSelectedCoupon(null);
                  setIsCouponModalOpen(true);
                }}
                variant="outline"
                size="sm"
                className="font-bold self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>New Coupon</span>
              </Button>
            </div>

            {coupons.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <TicketPercent className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold">No Coupons Created Yet</p>
                <p className="text-xs">Click "New Coupon" above to launch your first promotional discount.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coupons.map((coupon) => {
                  const isExpired = coupon.expiresAt ? coupon.expiresAt < Date.now() : false;

                  return (
                    <div
                      key={coupon.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        !coupon.isActive || isExpired
                          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-sm tracking-wider px-2.5 py-0.5 rounded-lg bg-brand-500 text-white shadow-xs">
                              {coupon.code}
                            </span>

                            {coupon.isActive && !isExpired ? (
                              <Badge variant="success">
                                ACTIVE
                              </Badge>
                            ) : isExpired ? (
                              <Badge variant="danger">
                                EXPIRED
                              </Badge>
                            ) : (
                              <Badge variant="warning">
                                INACTIVE
                              </Badge>
                            )}

                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              {coupon.discountType === 'percentage' ? (
                                <>
                                  <Percent className="w-3.5 h-3.5 text-brand-500" />
                                  <span>{coupon.discountValue}% OFF</span>
                                  {coupon.maxDiscount && (
                                    <span className="text-slate-400 font-normal">
                                      (Up to {formatINR(coupon.maxDiscount)})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <IndianRupee className="w-3.5 h-3.5 text-brand-500" />
                                  <span>FLAT {formatINR(coupon.discountValue)} OFF</span>
                                </>
                              )}
                            </span>
                          </div>

                          {coupon.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {coupon.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
                            {coupon.minOrderValue ? (
                              <span>Min Order: <strong>{formatINR(coupon.minOrderValue)}</strong></span>
                            ) : (
                              <span>No min order</span>
                            )}

                            {coupon.expiresAt ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Never expires</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions: Toggle Active, Edit, Delete */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(coupon)}
                            className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                              coupon.isActive
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                            title={coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                          >
                            {coupon.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setIsCouponModalOpen(true);
                            }}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Edit Coupon"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCouponToDelete(coupon)}
                            className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Coupon Modal (Create / Edit) */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        coupon={selectedCoupon}
        onSave={handleSaveCoupon}
      />

      {/* Coupon Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(couponToDelete)}
        onClose={() => setCouponToDelete(null)}
        onConfirm={handleDeleteCoupon}
        title="Delete Promo Coupon"
        message={`Are you sure you want to permanently delete coupon "${couponToDelete?.code}"? It will no longer be valid for customers.`}
        confirmText="Delete Coupon"
        isDestructive
      />
    </div>
  );
};
