import React, { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { fcmService } from '../../services/fcm.service';
import { useToast } from '../../contexts/ToastContext';

export interface CheckoutNotificationToggleProps {
  onToggleChange?: (enabled: boolean) => void;
  disabled?: boolean;
}

export const CheckoutNotificationToggle: React.FC<CheckoutNotificationToggleProps> = ({
  onToggleChange,
  disabled = false,
}) => {
  const toast = useToast();
  const initialPerm = typeof window !== 'undefined' ? fcmService.getPermissionState() : 'default';
  const [isEnabled, setIsEnabled] = useState<boolean>(initialPerm === 'granted');
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(initialPerm);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showBlockedHelp, setShowBlockedHelp] = useState<boolean>(false);

  useEffect(() => {
    const perm = fcmService.getPermissionState();
    setPermissionState(perm);
    const active = perm === 'granted';
    setIsEnabled(active);
    onToggleChange?.(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async () => {
    if (disabled || isProcessing) return;

    if (permissionState === 'unsupported') {
      toast.warning('Not Supported', 'Your current browser does not support background push notifications.');
      return;
    }

    // If currently enabled, allow user to toggle OFF
    if (isEnabled) {
      setIsEnabled(false);
      onToggleChange?.(false);
      toast.info('Notifications Paused', 'You will not receive background push alerts for this device.');
      return;
    }

    // User wants to enable notifications
    try {
      setIsProcessing(true);
      setShowBlockedHelp(false);

      const res = await fcmService.requestNotificationPermission();

      const newPerm = fcmService.getPermissionState();
      setPermissionState(newPerm);

      if (res.success && newPerm === 'granted') {
        setIsEnabled(true);
        onToggleChange?.(true);
        toast.success(
          '🔔 Push Alerts Activated!',
          'You will receive instant updates when your order is placed, packed, and out for delivery.'
        );
      } else {
        setIsEnabled(false);
        onToggleChange?.(false);
        if (newPerm === 'denied') {
          setShowBlockedHelp(true);
          toast.warning(
            'Permission Blocked',
            'Notifications are blocked in your browser settings. Tap the lock icon in the address bar to allow.'
          );
        }
      }
    } catch (err) {
      console.warn('[CheckoutNotificationToggle] Error requesting permission:', err);
      setIsEnabled(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-brand-500/5 to-transparent p-4 sm:p-5 transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon & Description */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              isEnabled
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isEnabled ? (
              <BellRing className="w-5 h-5 animate-pulse" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Live Order Updates via Push</span>
                {isEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    <Sparkles className="w-3 h-3" /> RECOMMENDED
                  </span>
                )}
              </h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Get notified when your order is confirmed, packed, and out for delivery
            </p>
          </div>
        </div>

        {/* Right: Modern iOS/Material Style Toggle Switch */}
        <div className="flex-shrink-0 pt-0.5">
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            disabled={disabled || isProcessing}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer ${
              isEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Blocked Permission Guide */}
      {showBlockedHelp && (
        <div className="mt-3.5 pt-3 border-t border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400 bg-rose-500/10 rounded-xl p-3">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Notifications Blocked in Browser</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              To turn on alerts: Click the padlock icon 🔒 in your browser address bar ➔ Site settings ➔ Set Notifications to <strong>Allow</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
