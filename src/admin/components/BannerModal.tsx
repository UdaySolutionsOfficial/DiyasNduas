import React, { useEffect, useState, useRef } from 'react';
import { Banner, BannerDraft } from '../../types/banner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { Button } from '../../components/ui/Button';
import { Image as ImageIcon, Sparkles, Smartphone, Upload } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

export interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: BannerDraft, bannerId?: string) => Promise<void>;
  banner?: Banner | null;
}

export const BannerModal: React.FC<BannerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  banner,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const desktopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (banner) {
      setTitle(banner.title);
      setSubtitle(banner.subtitle || '');
      setImageUrl(banner.imageUrl);
      setMobileImageUrl(banner.mobileImageUrl || '');
      setButtonText(banner.buttonText || '');
      setButtonUrl(banner.buttonUrl || '');
      setDisplayOrder(banner.displayOrder || 1);
      setIsActive(banner.isActive);
    } else {
      setTitle('');
      setSubtitle('');
      setImageUrl('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80');
      setMobileImageUrl('');
      setButtonText('Explore Diyas');
      setButtonUrl('/products');
      setDisplayOrder(1);
      setIsActive(true);
    }
    setError('');
  }, [banner, isOpen]);

  const handleDesktopFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 800, 0.8);
      setImageUrl(compressedDataUrl);
    } catch (err: any) {
      setError(err.message || 'Image upload failed.');
    }
  };

  const handleMobileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 800, 600, 0.8);
      setMobileImageUrl(compressedDataUrl);
    } catch (err: any) {
      setError(err.message || 'Mobile image upload failed.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError('Please provide a desktop banner image.');
      return;
    }

    try {
      setSaving(true);
      const draft: BannerDraft = {
        title: title.trim() || '',
        subtitle: subtitle.trim() || '',
        imageUrl: imageUrl.trim(),
        mobileImageUrl: mobileImageUrl.trim() || '',
        buttonText: buttonText.trim() || '',
        buttonUrl: buttonUrl.trim() || '',
        displayOrder: Number(displayOrder) || 1,
        isActive,
      };
      await onSave(draft, banner?.id);
      onClose();
    } catch (err: any) {
      console.error('[BannerModal]', err);
      setError(err.message || 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={banner ? 'Edit Banner' : 'Add New Promotional Banner'}>
      <form onSubmit={handleSave} className="space-y-4">
        {/* Live Visual Preview Box */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Visual Preview</label>
          <div className="relative h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-white p-4 flex flex-col justify-end">
            {(mobileImageUrl || imageUrl) && (
              <img src={mobileImageUrl || imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {(title || subtitle) && (
              <div className="relative z-10 space-y-0.5">
                <span className="text-[9px] font-extrabold text-amber-300 uppercase tracking-widest flex items-center gap-1 drop-shadow-md">
                  <Sparkles className="w-2.5 h-2.5" /> Feature Preview
                </span>
                <h4 className="font-extrabold text-sm truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{title || 'Banner Title'}</h4>
                <p className="text-[11px] text-amber-100 truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] font-medium">{subtitle || 'Banner subtitle text...'}</p>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}

        <Input
          label="Banner Title (Optional for graphic banners)"
          placeholder="e.g. Festive Season Sale (leave blank if image has text)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          leftIcon={<ImageIcon className="w-4 h-4" />}
        />

        <Input
          label="Subtitle Text"
          placeholder="e.g. Direct home delivery requests with up to 35% discount"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        {/* Desktop Image Section with Upload Button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Desktop Banner Image *
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs py-1"
              onClick={() => desktopFileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-brand-500" />
              <span>Upload File</span>
            </Button>
            <input
              type="file"
              ref={desktopFileInputRef}
              onChange={handleDesktopFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <Input
            placeholder="Paste Image URL or click 'Upload File'"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        {/* Mobile Image Section with Upload Button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mobile Image (Optional)
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs py-1"
              onClick={() => mobileFileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-brand-500" />
              <span>Upload Mobile File</span>
            </Button>
            <input
              type="file"
              ref={mobileFileInputRef}
              onChange={handleMobileFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <Input
            placeholder="Optional mobile image URL or click 'Upload Mobile File'"
            value={mobileImageUrl}
            onChange={(e) => setMobileImageUrl(e.target.value)}
            leftIcon={<Smartphone className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Button Label"
            placeholder="e.g. Explore Diyas"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
          />
          <Input
            label="Button Target Route"
            placeholder="e.g. /products"
            value={buttonUrl}
            onChange={(e) => setButtonUrl(e.target.value)}
          />
        </div>

        <Input
          label="Display Sequence Order"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(Number(e.target.value))}
        />

        <Toggle label="Active Promotional Banner" checked={isActive} onChange={setIsActive} />

        <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={saving} className="font-bold">
            {banner ? 'Update Banner' : 'Create Banner'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
