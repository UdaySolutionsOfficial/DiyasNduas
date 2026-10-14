import React, { useEffect, useState } from 'react';
import { Announcement, AnnouncementDraft, AnnouncementType } from '../../types/announcement';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../contexts/ToastContext';
import { Sparkles, Megaphone, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AnnouncementModalProps {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: AnnouncementDraft, id?: string) => Promise<void>;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  announcement,
  isOpen,
  onClose,
  onSave,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [text, setText] = useState('');
  const [type, setType] = useState<AnnouncementType>('festive');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (announcement) {
      setText(announcement.text);
      setType(announcement.type);
      setDisplayOrder(announcement.displayOrder);
      setIsActive(announcement.isActive);
    } else {
      setText('');
      setType('festive');
      setDisplayOrder(1);
      setIsActive(true);
    }
  }, [announcement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Validation Error', 'Announcement message text is required.');
      return;
    }

    setLoading(true);
    try {
      await onSave(
        {
          text: text.trim(),
          type,
          displayOrder: Number(displayOrder) || 1,
          isActive,
        },
        announcement?.id
      );
      toast.success(
        'Saved Successfully',
        announcement ? 'Announcement updated.' : 'New announcement published.'
      );
      onClose();
    } catch (err) {
      toast.error('Save Failed', 'Could not save announcement.');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'festive', label: '🎉 Festive Celebration (Brand Gradient)' },
    { value: 'info', label: '📢 Informational Notice (Dark Navy)' },
    { value: 'warning', label: '⚠️ Important Warning (Warm Amber)' },
    { value: 'success', label: '✅ Special Offer (Emerald Green)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={announcement ? 'Edit Store Announcement' : 'Create New Announcement'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Announcement Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="e.g. 🎉 Special Diwali Early Bird Discount Live! Free delivery on orders over ₹3,000."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            required
          />
        </div>

        <Select
          label="Announcement Style Theme"
          value={type}
          onChange={(e) => setType(e.target.value as AnnouncementType)}
          options={typeOptions}
        />

        <Input
          label="Display Sequence Order"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(Number(e.target.value))}
          min={1}
          placeholder="1"
        />

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Toggle
            label="Active Notice Status"
            checked={isActive}
            onChange={setIsActive}
          />
        </div>

        {/* Visual Live Preview */}
        <div className="pt-2 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Customer Live Preview
          </span>
          <div
            className={`p-2.5 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-2 ${
              type === 'festive'
                ? 'bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 text-white'
                : type === 'warning'
                ? 'bg-amber-600 text-white'
                : type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-100'
            }`}
          >
            {type === 'festive' && <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />}
            {type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-200" />}
            {type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
            {type === 'info' && <Megaphone className="w-3.5 h-3.5 text-slate-300" />}
            <span className="truncate">{text || 'Your announcement message preview text...'}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} variant="primary">
            {announcement ? 'Save Changes' : 'Publish Announcement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
