import React, { useEffect, useState, useRef } from 'react';
import { StoreSettings } from '../../types/settings';
import { settingsService } from '../../services/settings.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../contexts/ToastContext';
import { 
  Store, 
  Phone, 
  MessageSquare, 
  Mail, 
  MapPin, 
  Clock, 
  Save, 
  Sparkles,
  Info,
  Instagram,
  Truck,
  BellRing,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Link as LinkIcon
} from 'lucide-react';
import { fcmService } from '../../services/fcm.service';
import { compressImageFile } from '../../utils/imageCompressor';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [devicePushActive, setDevicePushActive] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const toast = useToast();

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setLogoUploading(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 512, 512, 0.85);
      setSettings(prev => prev ? { ...prev, logoUrl: compressedDataUrl } : prev);
      toast.success('Logo Selected', 'New logo preview loaded. Click "Save Changes" to apply.');
    } catch (err: any) {
      toast.error('Upload Error', err.message || 'Could not process image file.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleToggleDevicePush = async (enable: boolean) => {
    if (enable) {
      const res = await fcmService.registerAdminDeviceToken();
      if (res.success) {
        setDevicePushActive(true);
        toast.success('Push Alerts Enabled', 'This device will now receive instant push alerts when new orders are placed.');
      } else {
        toast.error('Permission Required', res.error || 'Please allow notification permission in your browser.');
        setDevicePushActive(false);
      }
    } else {
      localStorage.removeItem('dnd_admin_push_registered');
      setDevicePushActive(false);
      toast.info('Push Alerts Disabled', 'Notifications disabled for this session.');
    }
  };

  useEffect(() => {
    settingsService.getStoreSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      await settingsService.updateStoreSettings(settings);
      toast.success('Settings Saved', 'Store controls and contact information updated successfully.');
    } catch (err) {
      toast.error('Save Failed', 'Could not save store settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <Loading message="Loading store settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Store Controls & Settings</h1>
          <p className="text-sm text-slate-500">Configure store status, contact details, and customer instructions.</p>
        </div>

        <Button onClick={handleSave} isLoading={saving} className="font-bold">
          <Save className="w-4 h-4 mr-1.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Brand Logo Management Card */}
        <Card glass className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base">Store Brand Logo</h3>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                settings.logoUrl
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}
            >
              {settings.logoUrl ? '● Custom Logo Active' : '● Default Store Logo'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {/* Live Logo Preview Box */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border-2 border-amber-400/60 shadow-lg shadow-amber-500/10 flex items-center justify-center p-1.5">
                <img
                  src={settings.logoUrl || '/logo.png'}
                  alt="Store Logo Preview"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Live Preview</span>
            </div>

            {/* Logo Description & Actions */}
            <div className="space-y-3 flex-1 w-full text-center sm:text-left">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {settings.logoUrl ? 'Custom Brand Logo' : 'Default Store Logo (/logo.png)'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Changing your logo here will instantly reflect across the customer storefront (header, mobile navigation) and the admin control panel.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoFileUpload}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  isLoading={logoUploading}
                  className="font-bold inline-flex items-center gap-1.5"
                  leftIcon={<Upload className="w-3.5 h-3.5 text-amber-500" />}
                >
                  <span>Upload Logo Image</span>
                </Button>

                {settings.logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSettings({ ...settings, logoUrl: '' });
                      toast.info('Logo Reset', 'Reverted to default store logo. Click "Save Changes" to save.');
                    }}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold inline-flex items-center gap-1"
                    leftIcon={<RotateCcw className="w-3 h-3" />}
                  >
                    <span>Reset to Default</span>
                  </Button>
                )}
              </div>

              <div className="pt-1">
                <Input
                  label="Or Enter Image Web URL (Optional)"
                  placeholder="https://example.com/logo.png"
                  value={settings.logoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  leftIcon={<LinkIcon className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Operational Status Toggles */}
        <Card glass className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Store className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-base">Store Operational Controls</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <Toggle
                label="Store Open Status"
                checked={settings.isStoreOpen}
                onChange={(val) => setSettings({ ...settings, isStoreOpen: val })}
              />
              <div className="text-xs font-semibold text-slate-500">
                Current Status: {settings.isStoreOpen ? (
                  <span className="text-emerald-600 font-bold">● OPEN</span>
                ) : (
                  <span className="text-rose-600 font-bold">● CLOSED</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <Toggle
                label="Accept Order Requests"
                checked={settings.acceptingOrders}
                onChange={(val) => setSettings({ ...settings, acceptingOrders: val })}
              />
              <div className="text-xs font-semibold text-slate-500">
                Ordering State: {settings.acceptingOrders ? (
                  <span className="text-emerald-600 font-bold">● ORDERS ACTIVE</span>
                ) : (
                  <span className="text-amber-600 font-bold">● ORDERS SUSPENDED</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Store Contact & Business Information */}
        <Card glass className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Phone className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-base">Business Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Store Brand Name"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              leftIcon={<Store className="w-4 h-4" />}
            />

            <Input
              label="Contact Phone Number"
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <Input
              label="WhatsApp Support Number *"
              value={settings.whatsappNumber}
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
              leftIcon={<MessageSquare className="w-4 h-4" />}
              placeholder="+91 9876543210"
            />

            <Input
              label="Support Email Address"
              value={settings.storeEmail || ''}
              onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="support@diyasnduas.com"
            />

            <Input
              label="Instagram Profile / Handle"
              value={settings.instagramUrl || ''}
              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              leftIcon={<Instagram className="w-4 h-4 text-pink-500" />}
              placeholder="e.g. @diyasnduas or https://instagram.com/diyasnduas"
            />

            <div className="sm:col-span-2">
              <Input
                label="Store Physical Address"
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Business Hours"
                value={settings.businessHours || ''}
                onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
                leftIcon={<Clock className="w-4 h-4" />}
                placeholder="Mon - Sun: 9:00 AM - 9:00 PM"
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Google Maps Embed URL (Iframe src)"
                value={settings.mapEmbedUrl || ''}
                onChange={(e) => setSettings({ ...settings, mapEmbedUrl: e.target.value })}
                leftIcon={<MapPin className="w-4 h-4 text-emerald-500" />}
                placeholder="https://www.google.com/maps/embed?..."
                helperText="Paste the iframe src URL from Google Maps Embed. Leave default for Hyderabad store."
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Google Maps Directions URL"
                value={settings.mapDirectionsUrl || ''}
                onChange={(e) => setSettings({ ...settings, mapDirectionsUrl: e.target.value })}
                leftIcon={<MapPin className="w-4 h-4 text-rose-500" />}
                placeholder="https://www.google.com/maps/dir/?api=1&destination=..."
                helperText="Direct navigation link for customers clicking 'Visit Store' / 'Get Directions'."
              />
            </div>
          </div>
        </Card>

        {/* Delivery & Order Policy Settings */}
        <Card glass className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Truck className="w-5 h-5 text-brand-500" />
            <div>
              <h3 className="font-bold text-base">Delivery Charges & Free Shipping Policy</h3>
              <p className="text-xs text-slate-500">Configure free delivery threshold and base delivery fee</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Free Delivery Order Threshold (₹)"
              value={settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 1000}
              onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
              placeholder="1000"
              helperText="Orders equal to or above this value get 100% FREE delivery (Default: ₹1,000)."
            />

            <Input
              type="number"
              label="Standard Delivery Fee (₹)"
              value={settings.defaultDeliveryFee !== undefined ? settings.defaultDeliveryFee : 80}
              onChange={(e) => setSettings({ ...settings, defaultDeliveryFee: Number(e.target.value) })}
              placeholder="80"
              helperText="Charged for orders below the free delivery threshold (Default: ₹80)."
            />
          </div>
        </Card>

        {/* Catalog & Homepage Settings */}
        <Card glass className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-base">Homepage & Section Titles</h3>
          </div>

          <Input
            label="Featured Products Section Title"
            value={settings.featuredSectionTitle}
            onChange={(e) => setSettings({ ...settings, featuredSectionTitle: e.target.value })}
            placeholder="Featured Festive Collections"
          />

          <Input
            label="Top Notice Banner Text"
            value={settings.noticeBannerText || ''}
            onChange={(e) => setSettings({ ...settings, noticeBannerText: e.target.value })}
            placeholder="Welcome to Diyas N Duas! Handcrafted festive lights."
          />
        </Card>

        {/* Customer Order Instructions & Confirmation Notes */}
        <Card glass className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Info className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-base">Customer Instructions & Policy Notes</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Checkout Page Customer Instructions
              </label>
              <textarea
                value={settings.checkoutInstructions}
                onChange={(e) => setSettings({ ...settings, checkoutInstructions: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Order Confirmation Customer Note
              </label>
              <textarea
                value={settings.orderConfirmationNote}
                onChange={(e) => setSettings({ ...settings, orderConfirmationNote: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Admin Device Push Notifications Toggle */}
        <Card glass className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <BellRing className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base">Admin Push Notifications (This Device)</h3>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Instant Order Push Notifications on this Device</span>
                {devicePushActive ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Receive instant push notifications with sound when a new order is placed, even when your browser is closed or phone screen is locked.
              </p>
            </div>

            <Toggle
              checked={devicePushActive}
              onChange={handleToggleDevicePush}
              label=""
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={saving} size="lg" className="font-bold">
            <Save className="w-4 h-4 mr-2" />
            <span>Save Store Controls & Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
