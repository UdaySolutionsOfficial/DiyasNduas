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

    let isScheduled = false;

    const scheduleOpenModal = (delayMs = 1200) => {
      if (isScheduled) return;
      isScheduled = true;
      setTimeout(() => {
        const dismissed = localStorage.getItem(PWA_PROMPT_STORAGE_KEY);
        if (!dismissed) {
          setIsOpen(true);
        }
      }, delayMs);
    };

    // Check if the welcome splash animation is still active in this session
    const isWelcomePending = typeof window !== 'undefined' && !sessionStorage.getItem('ck_welcome_seen');

    const handleWelcomeCompleted = () => {
      // Natural 1.2s delay after the welcome splash completes
      scheduleOpenModal(1200);
    };

    if (isWelcomePending) {
      window.addEventListener('welcome-animation-completed', handleWelcomeCompleted, { once: true });
    }

    // Capture native Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const currentWelcomePending = typeof window !== 'undefined' && !sessionStorage.getItem('ck_welcome_seen');
      if (!currentWelcomePending) {
        scheduleOpenModal(1200);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: If beforeinstallprompt hasn't fired after 2.5s and prompt hasn't been dismissed
    const fallbackTimer = setTimeout(() => {
      const currentWelcomePending = typeof window !== 'undefined' && !sessionStorage.getItem('ck_welcome_seen');
      if (!currentWelcomePending) {
        scheduleOpenModal(500);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('welcome-animation-completed', handleWelcomeCompleted);
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
            Install the Diyas N Duas App!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Get instant live order tracking, exclusive early-bird festive discounts, and 1-tap checkout right from your home screen!
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <Button
            onClick={handleDismiss}
            variant="primary"
            size="lg"
            className="flex-1 font-black btn-shine-sweep bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 border-none shadow-lg shadow-amber-400/30 rounded-2xl inline-flex flex-row items-center justify-center gap-2 py-3 cursor-pointer"
          >
            <span>Continue on Web</span>
          </Button>

          <Button
            onClick={handleInstallApp}
            isLoading={isInstalling}
            variant="secondary"
            size="lg"
            className="flex-1 font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex flex-row items-center justify-center gap-2 py-3 cursor-pointer"
            leftIcon={<Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
          >
            <span>Install App</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
