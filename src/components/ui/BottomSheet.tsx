import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in pb-16 sm:pb-0">
      <div className="w-full sm:max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-sheet sm:shadow-2xl border-t sm:border border-slate-200/80 dark:border-slate-800/80 max-h-[78vh] sm:max-h-[85vh] flex flex-col animate-slide-up sm:animate-scale-in">
        {/* Mobile Pull Handle Indicator Bar */}
        <div className="w-full flex flex-col items-center pt-3 pb-1 sm:hidden cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800/80">
          {title && <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 line-clamp-1">{title}</h3>}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors ml-auto"
            aria-label="Close sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">{children}</div>
      </div>
    </div>
  );
};
