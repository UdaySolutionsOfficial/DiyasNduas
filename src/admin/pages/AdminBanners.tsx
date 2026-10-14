import React, { useEffect, useState } from 'react';
import { bannersService } from '../../services/banners.service';
import { Banner, BannerDraft } from '../../types/banner';
import { BannerModal } from '../components/BannerModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Plus, Edit2, Trash2, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toast = useToast();

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await bannersService.getAllBanners();
      setBanners(data);
    } catch (err) {
      console.warn('[AdminBanners]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleSaveBanner = async (draft: BannerDraft, bannerId?: string) => {
    try {
      if (bannerId) {
        await bannersService.updateBanner(bannerId, draft);
        toast.success('Banner Updated', `"${draft.title}" updated successfully.`);
      } else {
        await bannersService.createBanner(draft);
        toast.success('Banner Created', `"${draft.title}" created successfully.`);
      }
      await loadBanners();
    } catch (err: any) {
      console.error('[Save Banner Error]', err);
      toast.error('Save Failed', err.message || 'Could not save banner.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await bannersService.deleteBanner(deletingId);
      toast.success('Banner Deleted', 'Promotional banner removed.');
      setDeletingId(null);
      await loadBanners();
    } catch (err: any) {
      toast.error('Delete Failed', err.message || 'Could not delete banner.');
    }
  };

  if (loading) {
    return <Loading message="Loading promotional banners..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Promotional Banner Management</h1>
          <p className="text-sm text-slate-500">Manage customer homepage promotional banners and campaign offers.</p>
        </div>

        <Button
          onClick={() => {
            setSelectedBanner(null);
            setIsModalOpen(true);
          }}
          variant="primary"
          size="md"
          className="font-bold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Banner</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner) => (
          <Card key={banner.id} glass className="p-4 space-y-3 rounded-2xl flex flex-col justify-between">
            {/* Visual Preview */}
            <div className="relative h-36 rounded-xl overflow-hidden bg-slate-900 text-white p-4 flex flex-col justify-end">
              <img src={banner.mobileImageUrl || banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="relative z-10 space-y-0.5">
                <span className="text-[9px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Sequence #{banner.displayOrder || 1}
                </span>
                <h3 className="font-extrabold text-base line-clamp-1">{banner.title}</h3>
                {banner.subtitle && <p className="text-xs text-blue-100 line-clamp-1">{banner.subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
              <Badge variant={banner.isActive ? 'success' : 'neutral'}>
                {banner.isActive ? 'Active Carousel' : 'Inactive'}
              </Badge>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedBanner(banner);
                    setIsModalOpen(true);
                  }}
                  className="font-bold text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  <span>Edit</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeletingId(banner.id)}
                  className="text-slate-400 hover:text-rose-600"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <BannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBanner}
        banner={selectedBanner}
      />

      <ConfirmationDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Banner?"
        message="Are you sure you want to permanently remove this promotional banner from the homepage?"
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};
