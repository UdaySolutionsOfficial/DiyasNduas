import React from 'react';
import { StoreSettings } from '../../types/settings';
import { env } from '../../config/env';
import { openWhatsAppGeneralChat } from '../../utils/whatsapp';

export interface WhatsAppFloatingButtonProps {
  settings?: StoreSettings | null;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ settings }) => {
  const whatsappNumber = settings?.whatsappNumber || settings?.contactPhone || env.store.supportPhone;
  const storeName = settings?.storeName || env.store.name;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openWhatsAppGeneralChat(whatsappNumber, storeName);
  };

  return (
    <div
      className="fixed bottom-20 right-4 sm:bottom-20 sm:right-6 md:bottom-6 md:right-6 z-40 flex items-center group select-none pointer-events-auto"
      title={`Chat with ${storeName} on WhatsApp`}
    >
      {/* Desktop Hover Label Pill */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 mr-2.5 rounded-full bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
          Chat on WhatsApp
        </span>
      </div>

      {/* Main WhatsApp Floating Action Button */}
      <button
        type="button"
        onClick={handleClick}
        className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#128C7E] via-[#20BA5A] to-[#25D366] text-white flex items-center justify-center border-2 border-amber-300/80 dark:border-amber-400/90 shadow-[0_8px_25px_rgba(37,211,102,0.45),0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_12px_32px_rgba(37,211,102,0.65),0_0_22px_rgba(245,158,11,0.45)] hover:scale-108 active:scale-95 transition-all duration-300 ring-2 ring-white/60 dark:ring-slate-900 cursor-pointer"
        aria-label="Open WhatsApp Customer Support"
      >
        {/* Subtle Ambient Radar Pulse Aura */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

        {/* Small Golden Festive Rising Sparkles (Emit upwards from button) */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {/* Sparkle 1: Top-Left Drift */}
          <svg
            className="absolute -top-1 left-1 w-3.5 h-3.5 text-amber-300 fill-amber-300 wa-sparkle-1 drop-shadow-[0_0_5px_rgba(251,191,36,0.9)]"
            viewBox="0 0 24 24"
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>

          {/* Sparkle 2: Top-Right Drift */}
          <svg
            className="absolute -top-1 right-1 w-3 h-3 text-amber-400 fill-amber-400 wa-sparkle-2 drop-shadow-[0_0_5px_rgba(245,158,11,0.9)]"
            viewBox="0 0 24 24"
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>

          {/* Sparkle 3: Top-Center Rise */}
          <svg
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 text-amber-200 fill-amber-200 wa-sparkle-3 drop-shadow-[0_0_6px_rgba(254,240,138,0.9)]"
            viewBox="0 0 24 24"
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>

        {/* Official WhatsApp Clean SVG Icon */}
        <svg
          className="w-8 h-8 fill-current drop-shadow-sm transform group-hover:rotate-6 transition-transform duration-300"
          viewBox="0 0 24 24"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.89-.447-1.579-.65-2.584-2.26-2.663-2.366-.079-.105-.64-.852-.64-1.626 0-.773.405-1.155.549-1.313.144-.158.314-.198.419-.198.105 0 .21.002.301.006.096.004.225-.036.352.268.13.31.444 1.082.483 1.161.039.08.065.173.013.277-.052.105-.078.17-.156.262-.078.092-.164.205-.235.276-.08.08-.163.167-.07.327.093.16.413.682.887 1.103.61.542 1.123.71 1.282.789.159.08.252.067.345-.04.093-.106.398-.463.504-.622.106-.16.212-.132.358-.079.146.053.926.437 1.085.516.159.08.265.119.304.186.039.066.039.385-.105.79z" />
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5.14-1.32C8.6 21.53 10.26 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2c-1.58 0-3.07-.44-4.35-1.2l-.31-.18-3.04.78.81-2.96-.2-.32C4.1 15.04 3.65 13.56 3.65 12c0-4.6 3.75-8.35 8.35-8.35s8.35 3.75 8.35 8.35-3.75 8.35-8.35 8.35z" />
        </svg>
      </button>
    </div>
  );
};
