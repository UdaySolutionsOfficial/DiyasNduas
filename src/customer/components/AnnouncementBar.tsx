import React, { useEffect, useState } from 'react';
import { Announcement } from '../../types/announcement';
import { announcementsService } from '../../services/announcements.service';
import { Sparkles, X, Megaphone, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    announcementsService.getActiveAnnouncements().then((data) => {
      setAnnouncements(data);
    });
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [announcements]);

  if (dismissed || announcements.length === 0) {
    return null;
  }

  const activeAnn = announcements[currentIndex];

  const getTypeStyles = (type: Announcement['type']) => {
    switch (type) {
      case 'festive':
        return 'bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 text-white';
      case 'warning':
        return 'bg-amber-600 text-white';
      case 'success':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-slate-800 text-slate-100';
    }
  };

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'festive':
        return <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0" />;
      default:
        return <Megaphone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />;
    }
  };

  return (
    <div className={`py-2 px-4 text-xs font-medium shadow-sm transition-colors relative ${getTypeStyles(activeAnn.type)}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center justify-center gap-2 text-center w-full">
          {getTypeIcon(activeAnn.type)}
          <span className="truncate max-w-xl sm:max-w-3xl">{activeAnn.text}</span>
          {announcements.length > 1 && (
            <span className="text-[10px] opacity-75 font-mono">
              ({currentIndex + 1}/{announcements.length})
            </span>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-white/20 transition-colors flex-shrink-0 cursor-pointer"
          title="Dismiss Notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
