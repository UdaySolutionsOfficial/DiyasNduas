import React, { useEffect, useState } from 'react';
import { Announcement, AnnouncementDraft } from '../../types/announcement';
import { announcementsService } from '../../services/announcements.service';
import { AnnouncementModal } from '../components/AnnouncementModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit2, Trash2, Megaphone, Check, X } from 'lucide-react';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toast = useToast();

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementsService.getAllAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      toast.error('Error', 'Failed to load store announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSave = async (draft: AnnouncementDraft, id?: string) => {
    if (id) {
      await announcementsService.updateAnnouncement(id, draft);
    } else {
      await announcementsService.createAnnouncement(draft);
    }
    await loadAnnouncements();
  };

  const handleToggleActive = async (ann: Announcement) => {
    const nextState = !ann.isActive;
    await announcementsService.updateAnnouncement(ann.id, { isActive: nextState });
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === ann.id ? { ...a, isActive: nextState } : a))
    );
    toast.info('Status Updated', `Announcement ${nextState ? 'activated' : 'deactivated'}.`);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await announcementsService.deleteAnnouncement(deletingId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deletingId));
      toast.success('Deleted', 'Announcement removed successfully.');
    } catch (err) {
      toast.error('Error', 'Could not delete announcement.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Store Announcements</h1>
          <p className="text-sm text-slate-500">Manage top announcement messages displayed to customers.</p>
        </div>

        <Button
          onClick={() => {
            setEditingAnn(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Announcement</span>
        </Button>
      </div>

      {loading ? (
        <Loading message="Loading store announcements..." />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-10 h-10 text-brand-500" />}
          title="No Announcements Found"
          description="Create your first store announcement notice to display at the top of customer pages."
          actionText="Create Announcement"
          onAction={() => {
            setEditingAnn(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <Card
              key={ann.id}
              glass
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Seq #{ann.displayOrder}
                  </span>
                  <Badge variant={ann.isActive ? 'brand' : 'neutral'} className="text-[10px]">
                    {ann.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                    Theme: {ann.type}
                  </span>
                </div>

                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {ann.text}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <Button
                  size="sm"
                  variant={ann.isActive ? 'secondary' : 'primary'}
                  onClick={() => handleToggleActive(ann)}
                  className="text-xs"
                >
                  {ann.isActive ? <X className="w-3.5 h-3.5 mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  <span>{ann.isActive ? 'Deactivate' : 'Activate'}</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingAnn(ann);
                    setModalOpen(true);
                  }}
                  title="Edit Announcement"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeletingId(ann.id)}
                  className="text-slate-400 hover:text-rose-600"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AnnouncementModal
        announcement={editingAnn}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmationDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Announcement?"
        message="Are you sure you want to permanently remove this store announcement?"
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};
