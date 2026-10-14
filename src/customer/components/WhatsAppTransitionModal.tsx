import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CelebrationConfetti } from '../../components/common/CelebrationConfetti';
import { MessageSquare, Check, ShieldCheck } from 'lucide-react';
import { Order } from '../../types/order';

interface WhatsAppTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirmWhatsApp: () => void;
}

export const WhatsAppTransitionModal: React.FC<WhatsAppTransitionModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmWhatsApp,
}) => {
  const [countdown, setCountdown] = useState(5);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasTriggeredRef.current = false;
      return;
    }

    setCountdown(5);
    hasTriggeredRef.current = false;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            onConfirmWhatsApp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onConfirmWhatsApp]);

  const handleManualClick = () => {
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onConfirmWhatsApp();
    }
  };

  if (!order) return null;

  return (
    <>
      {/* Animated Celebration Confetti Overlay - z-[110] renders in front of modal backdrop blur */}
      {isOpen && <CelebrationConfetti />}

      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" hideScrollbar={true}>
        <div className="space-y-3.5 text-center pt-0 pb-1 px-1 animate-fade-in overflow-hidden relative z-10">
          {/* Gold/Emerald Circular Checkmark Badge */}
          <div className="relative inline-flex items-center justify-center pt-1">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 dark:from-amber-500 dark:to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <span>🎉 Order Confirmed Successfully!</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              THANK YOU FOR CHOOSING DIYAS N DUAS
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto font-medium leading-relaxed pt-0.5">
              Your order details have been compiled. To place your order, you will now be redirected to WhatsApp.
            </p>
          </div>

          {/* Countdown Section */}
          <div className="space-y-1 py-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
              OPENING WHATSAPP IN
            </span>
            <div className="flex justify-center">
              <div className="relative inline-flex items-center justify-center w-12 h-12">
                <div className="w-12 h-12 rounded-full border-3 border-amber-500/30 border-t-amber-500 animate-spin" />
                <span className="absolute text-lg font-black text-slate-900 dark:text-slate-100">
                  {countdown}
                </span>
              </div>
            </div>
          </div>

          {/* Full-Width Prominent Primary Action Button */}
          <div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleManualClick}
              className="w-full font-black text-xs sm:text-sm btn-shine-sweep bg-amber-400 hover:bg-amber-500 text-slate-950 border-none shadow-lg shadow-amber-400/30 rounded-2xl py-3"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span>OPEN WHATSAPP NOW</span>
            </Button>
          </div>

          {/* Bottom Security / Instruction Notice Box */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 text-left space-y-1 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400 tracking-wide uppercase text-[9px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>IMPORTANT INSTRUCTION</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Your order will open in WhatsApp with a prefilled message. Please press <strong className="text-slate-900 dark:text-slate-100 font-black">SEND</strong> inside WhatsApp to finalize your order. Your order is <strong className="text-slate-900 dark:text-slate-100 font-black">NOT</strong> received by our store until you press send.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
