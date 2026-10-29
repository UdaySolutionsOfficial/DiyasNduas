import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { settingsService } from '../../services/settings.service';
import { Sparkles, Flame, ArrowRight } from 'lucide-react';

export interface WelcomeExperienceProps {
  onComplete: () => void;
}

export const WelcomeExperience: React.FC<WelcomeExperienceProps> = ({ onComplete }) => {
  const [fade, setFade] = useState(false);
  const completedRef = useRef(false);

  // Synchronous initial value from persistent local cache for instant 0ms render
  const cached = settingsService.getCachedSettings();
  const [logoUrl, setLogoUrl] = useState(cached.logoUrl || '/logo.png');
  const [storeName, setStoreName] = useState(cached.storeName || 'Diyas N Duas');

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    sessionStorage.setItem('ck_welcome_seen', 'true');
    // Notify modals (PWA install prompt, notifications) that welcome entrance has completed smoothly
    window.dispatchEvent(new CustomEvent('welcome-animation-completed'));
    setFade(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  useEffect(() => {
    // Lock body scroll during entrance animation so background page stays completely still
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Realtime listener for dynamic cloud store settings
    const unsubscribe = settingsService.subscribeToStoreSettings((s) => {
      if (s.logoUrl) setLogoUrl(s.logoUrl);
      if (s.storeName) setStoreName(s.storeName);
    });

    // Native app-style entrance timing: 2.5s duration (like Flipkart, Amazon, Meesho, Shopsy)
    const timer = setTimeout(() => {
      handleFinish();
    }, 2500);

    return () => {
      document.body.style.overflow = originalOverflow;
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[999999] w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-[#FAF6F0] dark:bg-[#140406] select-none cursor-pointer transition-all duration-500 ease-out ${
        fade ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: undefined }}
      aria-label={`Welcome to ${storeName}`}
    >
      {/* Top-Right Quick Skip Action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleFinish();
        }}
        className="absolute top-6 right-6 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-900/60 shadow-md transition-all hover:scale-105 active:scale-95"
        aria-label="Skip entrance animation"
      >
        <span>Skip</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Solid Festive Subtle Radial Aura (Decorates the solid background without transparency) */}
      <div className="absolute w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tr from-amber-400/25 via-orange-400/20 to-transparent blur-3xl pointer-events-none splash-aura-pulse" />

      {/* Floating Festive Sparkle Micro-Accents */}
      <Sparkles className="absolute top-[22%] left-[20%] w-5 h-5 text-amber-500/50 pointer-events-none splash-sparkle-spin" />
      <Sparkles
        className="absolute bottom-[24%] right-[22%] w-6 h-6 text-orange-500/40 pointer-events-none splash-sparkle-spin"
        style={{ animationDelay: '1.2s' }}
      />
      <Flame className="absolute top-[30%] right-[24%] w-5 h-5 text-amber-500/40 pointer-events-none animate-pulse" />

      {/* Main Centered Brand Showcase */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-sm w-full mx-auto">
        {/* Animated Brand Logo Medallion */}
        <div className="relative splash-logo-enter">
          {/* Pulsating Golden Halo Glow */}
          <div className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-40 blur-md splash-aura-pulse" />

          {/* Double-Ring Royal Logo Frame */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-gold-400 to-orange-500 shadow-[0_12px_36px_rgba(217,119,6,0.35)] ring-4 ring-amber-200 dark:ring-amber-900/60">
            <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 p-1 flex items-center justify-center shadow-inner">
              <img
                src={logoUrl || '/logo.png'}
                alt={`${storeName} Logo`}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
          </div>

          {/* Sacred Diya Flame Badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-lg flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
            <Flame className="w-4 h-4 text-white fill-amber-200" />
          </div>
        </div>

        {/* Animated Brand Title & Tagline */}
        <div className="text-center mt-6 space-y-1.5 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 dark:from-amber-200 dark:via-orange-300 dark:to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
            {storeName}
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-amber-800/90 dark:text-amber-400 uppercase">
            Handcrafted Festive Diyas &amp; Sacred Light
          </p>
        </div>

        {/* Festive Trust Badges */}
        <div className="flex items-center justify-center gap-2 mt-4 px-3.5 py-1 rounded-full bg-amber-100/70 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/50 text-[11px] font-semibold text-amber-900 dark:text-amber-300 shadow-xs animate-fade-in">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Pure Clay Craft</span>
          </span>
          <span className="text-amber-400 dark:text-amber-700">•</span>
          <span>Safe Transit Packaging</span>
          <span className="text-amber-400 dark:text-amber-700">•</span>
          <span>Festive Express</span>
        </div>

        {/* App-Style Modern Progress Loading Bar */}
        <div className="w-52 sm:w-64 mt-6 space-y-1.5 flex flex-col items-center">
          <div className="w-full h-1.5 bg-amber-200/70 dark:bg-amber-950 rounded-full overflow-hidden shadow-inner p-0.5">
            <div className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full splash-progress-fill" />
          </div>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
            Lighting your festive experience...
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
