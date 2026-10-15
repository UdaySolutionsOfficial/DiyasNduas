import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { fcmService } from '../../services/fcm.service';
import { Bell, BellRing, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

const NOTIFICATION_PROMPT_KEY = 'dnd_notification_prompt_seen';

export const NotificationPromptModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    // Check if permission already determined or prompt dismissed
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return;
    }

    const seen = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
    if (seen === 'true') {
      return;
    }

    const pwaDismissed = localStorage.getItem('ck_pwa_prompt_dismissed') === 'true';
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    // If PWA modal hasn't been decided yet and not in standalone app, strictly wait for user decision
    if (!pwaDismissed && !isStandalone) {
      const handlePwaClosed = () => {
        setTimeout(() => {
          const recheck = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
          const perm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied';
          if (recheck !== 'true' && perm === 'default') {
            setIsOpen(true);
          }
        }, 1000);
      };

      window.addEventListener('pwa-modal-closed', handlePwaClosed, { once: true });

      return () => {
        window.removeEventListener('pwa-modal-closed', handlePwaClosed);
      };
    } else {
      // PWA decision was already made or app is installed; show notification prompt after 1.5s
      const timer = setTimeout(() => {
        const recheck = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
        const perm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied';
        if (recheck !== 'true' && perm === 'default') {
          setIsOpen(true);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setIsOpen(false);
  };

  const handleAllowNotifications = async () => {
    try {
      setLoading(true);
      const res = await fcmService.requestNotificationPermission();
      if (res.success) {
        setGranted(true);
        setTimeout(() => {
          localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
          setIsOpen(false);
        }, 1200);
      } else {
        handleDismiss();
      }
    } catch {
      handleDismiss();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} maxWidth="max-w-md">
      <div className="space-y-4 sm:space-y-5 text-center p-1 sm:p-2 max-h-[85vh] overflow-y-auto animate-scale-in">
        {/* Animated Festive Diya Bell Icon */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 via-brand-500/30 to-amber-300/30 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-2xl shadow-amber-500/40 ring-4 ring-amber-300/30 flex items-center justify-center text-slate-950">
            {granted ? (
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-scale-in" />
            ) : (
              <div className="relative">
                <BellRing className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Text */}
        <div className="space-y-2 px-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-[10px] sm:text-[11px] font-black shadow-xs">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 animate-spin" />
            <span>NEVER MISS YOUR DIYAS DELIVERY</span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {granted ? 'NOTIFICATIONS ENABLED!' : 'TURN ON LIVE ORDER ALERTS'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {granted
              ? 'Your device is now connected. You will receive instant order status updates and sacred festive announcements!'
              : 'Receive real-time alerts when your order is Confirmed, Packed, Transported, or Delivered — even when your phone screen is off!'}
          </p>
        </div>

        {/* Trust Points */}
        <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300 pt-0.5">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center gap-1.5 sm:gap-2 justify-center">
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
            <span className="truncate">Instant Tracking</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center gap-1.5 sm:gap-2 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            <span className="truncate">100% Spam Free</span>
          </div>
        </div>

        {/* Action Controls */}
        {!granted && (
          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={handleAllowNotifications}
              isLoading={loading}
              variant="primary"
              size="lg"
              className="w-full font-black btn-shine-sweep bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 border-none shadow-xl shadow-amber-400/30 rounded-xl sm:rounded-2xl inline-flex flex-row items-center justify-center gap-2 py-3 sm:py-3.5 min-h-[46px]"
              leftIcon={<BellRing className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />}
            >
              <span className="text-xs sm:text-sm">ALLOW NOTIFICATIONS</span>
            </Button>

            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1.5"
            >
              <span>Maybe Later</span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
