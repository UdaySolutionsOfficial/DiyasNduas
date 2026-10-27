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
    const isWelcomePending = typeof window !== 'undefined' && !sessionStorage.getItem('ck_welcome_seen');

    // If PWA modal hasn't been decided yet and not in standalone app, strictly wait for PWA user decision
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
      // PWA decision was already made or app is installed.
      // If welcome animation is currently pending, wait for it before showing notifications prompt
      const scheduleNotificationPrompt = () => {
        setTimeout(() => {
          const recheck = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
          const perm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied';
          if (recheck !== 'true' && perm === 'default') {
            setIsOpen(true);
          }
        }, 1500);
      };

      if (isWelcomePending) {
        window.addEventListener('welcome-animation-completed', scheduleNotificationPrompt, { once: true });
        return () => window.removeEventListener('welcome-animation-completed', scheduleNotificationPrompt);
      } else {
        const timer = setTimeout(scheduleNotificationPrompt, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setIsOpen(false);
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const res = await fcmService.requestNotificationPermission();
      if (res.success) {
        setGranted(true);
        localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
        setTimeout(() => {
          setIsOpen(false);
        }, 1200);
      } else {
        handleDismiss();
      }
    } catch (err) {
      console.warn('[FCM Notification Opt-In Prompt Error]', err);
      handleDismiss();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} maxWidth="max-w-md">
      <div className="space-y-5 text-center animate-scale-in">
        {/* Festive Golden Icon Header with Animated Pulsing Waves */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/40 transform hover:rotate-6 transition-transform">
            {granted ? (
              <CheckCircle2 className="w-8 h-8 text-slate-950 animate-scale-in" />
            ) : (
              <BellRing className="w-8 h-8 animate-bounce" />
            )}
          </div>
        </div>

        {/* Modal Text */}
        <div className="space-y-2 px-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 text-xs font-black">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span>INSTANT DISPATCH ALERTS</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {granted ? 'Notifications Activated!' : 'Stay Updated on Your Orders!'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {granted
              ? 'You will now receive direct real-time updates when your handcrafted diyas are packed and shipped!'
              : 'Turn on instant notifications to get real-time package tracking, festival discount drops, and live order status right to your phone.'}
          </p>
        </div>

        {/* Feature Badges */}
        {!granted && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-around text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>No Spam</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Order Updates</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Festive Drops</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex flex-col gap-2.5">
          {!granted ? (
            <>
              <Button
                onClick={handleEnableNotifications}
                isLoading={loading}
                variant="primary"
                size="lg"
                className="w-full font-black btn-shine-sweep bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 border-none shadow-lg shadow-amber-400/30 rounded-2xl py-3 cursor-pointer"
              >
                <BellRing className="w-4 h-4 mr-2" />
                <span>Enable Notifications</span>
              </Button>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1 transition-colors"
              >
                Maybe Later
              </button>
            </>
          ) : (
            <div className="p-2 text-center text-xs font-black text-emerald-600 dark:text-emerald-400 animate-pulse">
              ✓ Ready for festival updates!
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
