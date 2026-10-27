import React from 'react';
import { Sparkles } from 'lucide-react';

export interface PreBookButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  showSparklesOutside?: boolean;
}

export const PreBookButton: React.FC<PreBookButtonProps> = ({
  label = 'Pre-Book',
  showSparklesOutside = true,
  className = '',
  onClick,
  ...props
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl btn-prebook-animated font-black cursor-pointer select-none whitespace-nowrap transition-all shadow-xs ${className}`}
      {...props}
    >
      {/* Outer Floating Sparkle Particles */}
      {showSparklesOutside && (
        <>
          {/* Top-Right Floating Golden Star */}
          <span className="absolute -top-1.5 -right-1.5 pointer-events-none prebook-sparkle-tr z-10" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.9)]">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </span>

          {/* Bottom-Left Floating Golden Star */}
          <span className="absolute -bottom-1 -left-1.5 pointer-events-none prebook-sparkle-bl z-10" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-yellow-200 drop-shadow-[0_0_4px_rgba(254,240,138,0.9)]">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </span>

          {/* Top-Left Subtle Starburst */}
          <span className="absolute -top-1 left-2 pointer-events-none prebook-sparkle-tl z-10 hidden sm:block" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="w-2 h-2 fill-amber-200 drop-shadow-[0_0_3px_rgba(253,230,138,0.8)]">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </span>
        </>
      )}

      {/* Button Content */}
      <Sparkles className="w-3 h-3 text-amber-100 flex-shrink-0 animate-pulse" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
};
