import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Sparkles, Download } from 'lucide-react';

const PWA_PROMPT_STORAGE_KEY = 'ck_pwa_prompt_dismissed';

export const PWAInstallModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if user has already seen and dismissed the first-time prompt
    const hasSeenPrompt = localStorage.getItem(PWA_PROMPT_STORAGE_KEY);
    if (hasSeenPrompt === 'true') {
      return;
    }

    // Capture native Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Delay prompt slightly for a smooth first-time experience
      setTimeout(() => {
        setIsOpen(true);
      }, 1200);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: If beforeinstallprompt hasn't fired after 2.5s and prompt hasn't been dismissed, show promo
    const fallbackTimer = setTimeout(() => {
      const dismissed = localStorage.getItem(PWA_PROMPT_STORAGE_KEY);
      if (!dismissed) {
        setIsOpen(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(PWA_PROMPT_STORAGE_KEY, 'true');
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('pwa-modal-closed'));
  };

  const handleInstallApp = async () => {
    localStorage.setItem(PWA_PROMPT_STORAGE_KEY, 'true');

    if (deferredPrompt) {
      try {
        setIsInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA Install Outcome]', outcome);
      } catch (err) {
        console.warn('[PWA Install Prompt Error]', err);
      } finally {
        setIsInstalling(false);
        setDeferredPrompt(null);
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent('pwa-modal-closed'));
      }
    } else {
      // Direct instruction fallback if browser prompt already handled by OS
      alert('To install Diyas N Duas:\n• On Chrome/Android: Tap the 3 dots menu ➔ "Install App"\n• On iPhone/Safari: Tap Share ➔ "Add to Home Screen"');
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent('pwa-modal-closed'));
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} maxWidth="max-w-lg">
      <div className="space-y-4 text-center animate-scale-in">
        {/* Top Banner Image with Glossy Gradient Border */}
        <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl shadow-brand-500/20 bg-slate-900 aspect-[16/9]">
          <img
            src="/pwa_install_banner.jpg"
            alt="Diyas N Duas App Install Promo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EXCITING FESTIVE OFFERS AHEAD!</span>
            </div>
          </div>
        </div>

        {/* Modal Title & Text Content */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            INSTALL THE DIYAS N DUAS APP!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Get instant live order tracking, exclusive early-bird festive discounts, and 1-tap checkout right from your home screen!
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <Button
            onClick={handleInstallApp}
            isLoading={isInstalling}
            variant="primary"
            size="lg"
            className="flex-1 font-black btn-shine-sweep bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 border-none shadow-lg shadow-amber-400/30 rounded-2xl inline-flex flex-row items-center justify-center gap-2"
            leftIcon={<Download className="w-5 h-5 text-slate-950" />}
          >
            <span>INSTALL APP NOW</span>
          </Button>

          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="md"
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <span>Continue on Web</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
