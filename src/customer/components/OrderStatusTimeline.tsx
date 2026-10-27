import React from 'react';
import { OrderStatus, OrderStatusHistoryItem } from '../../types/order';
import { Check, Clock, PackageCheck, Truck, CheckCircle2, XCircle, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

export interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: OrderStatusHistoryItem[];
  cancellationReason?: string;
  isPreOrder?: boolean;
}

interface TimelineStepItem {
  id: string;
  statusKey: OrderStatus | 'cancel_rejected';
  title: string;
  description: string;
  icon: React.ElementType;
  isWarning?: boolean;
  isError?: boolean;
  isPreOrderSpecial?: boolean;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  currentStatus,
  statusHistory = [],
  cancellationReason,
  isPreOrder = false,
}) => {
  const hasRequestedCancel = 
    currentStatus === 'cancel_requested' || 
    statusHistory.some((h) => h.status === 'cancel_requested');

  const wasCancelRejected = statusHistory.some(
    (h) => h.note && h.note.toLowerCase().includes('rejected')
  );

  // Build Dynamic Timeline Steps List
  const steps: TimelineStepItem[] = isPreOrder
    ? [
        {
          id: 'step_pending',
          statusKey: 'pending',
          title: 'Pre-Order Requested',
          description: 'Your pre-order request has been received and is waiting for store review.',
          icon: Clock,
        },
        {
          id: 'step_pre_order_confirmed',
          statusKey: 'pre_order_confirmed',
          title: 'Pre-Order Accepted',
          description: 'Your pre-order request has been verified and accepted by Diyas N Duas! Crafting is underway.',
          icon: Sparkles,
          isPreOrderSpecial: true,
        },
      ]
    : [
        {
          id: 'step_pending',
          statusKey: 'pending',
          title: 'Order Request Received',
          description: 'Your order has been received and is waiting for store confirmation.',
          icon: Clock,
        },
        {
          id: 'step_confirmed',
          statusKey: 'confirmed',
          title: 'Order Confirmed',
          description: 'Your order request has been verified and confirmed by Diyas N Duas.',
          icon: CheckCircle2,
        },
      ];

  // Insert Cancellation Request Step ONLY if customer initiated cancellation
  if (hasRequestedCancel) {
    const reasonText = cancellationReason || 
      statusHistory.find(h => h.status === 'cancel_requested')?.note?.replace(/Cancel request initiated by customer\. Reason:\s*/i, '').replace(/^"|"$/g, '') ||
      'Customer requested cancellation';

    steps.push({
      id: 'step_cancel_requested',
      statusKey: 'cancel_requested',
      title: 'Order Cancellation Requested',
      description: `Reason: "${reasonText}"`,
      icon: AlertTriangle,
      isWarning: true,
    });
  }

  // Insert Rejection Step ONLY if Admin rejected cancellation
  if (wasCancelRejected) {
    steps.push({
      id: 'step_cancel_rejected',
      statusKey: 'cancel_rejected',
      title: 'Cancellation Request Rejected',
      description: 'Store admin reviewed and rejected the cancellation request. Order proceeding with despatch.',
      icon: AlertCircle,
      isWarning: true,
    });
  }

  // Insert Cancelled Step if Order is Cancelled
  if (currentStatus === 'cancelled') {
    steps.push({
      id: 'step_cancelled',
      statusKey: 'cancelled',
      title: 'Order Cancelled',
      description: 'Order cancelled by store admin.',
      icon: XCircle,
      isError: true,
    });
  } else {
    // Normal Despatch Flow
    steps.push(
      {
        id: 'step_processing',
        statusKey: 'processing',
        title: isPreOrder ? 'Crafting & Packaging' : 'Packaging Diyas',
        description: isPreOrder
          ? 'Your handcrafted items are being crafted and packed with divine festive care.'
          : 'Your handcrafted diyas are being safely packed with festive care.',
        icon: PackageCheck,
      },
      {
        id: 'step_ready',
        statusKey: 'ready',
        title: 'Ready for Transport',
        description: 'Your order parcel is ready for transport despatch.',
        icon: Truck,
      },
      {
        id: 'step_delivered',
        statusKey: 'delivered',
        title: 'Order Fulfilled',
        description: 'Your order request has been successfully completed!',
        icon: Check,
      }
    );
  }

  // Calculate current active step index in our dynamic steps array
  let activeIndex = 0;
  if (currentStatus === 'cancel_requested') {
    activeIndex = steps.findIndex((s) => s.statusKey === 'cancel_requested');
  } else if (currentStatus === 'cancelled') {
    activeIndex = steps.findIndex((s) => s.statusKey === 'cancelled');
  } else if (wasCancelRejected) {
    let lastMatchingIdx = -1;
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].statusKey === currentStatus || (steps[i].statusKey === 'pre_order_confirmed' && currentStatus === 'confirmed')) {
        lastMatchingIdx = i;
        break;
      }
    }
    if (lastMatchingIdx !== -1) {
      activeIndex = lastMatchingIdx;
    } else {
      activeIndex = steps.findIndex((s) => s.statusKey === 'cancel_rejected');
    }
  } else {
    // Normal or pre-order matching
    const idx = steps.findIndex((s) => {
      if (s.statusKey === currentStatus) return true;
      if (isPreOrder && s.statusKey === 'pre_order_confirmed' && currentStatus === 'confirmed') return true;
      if (isPreOrder && s.statusKey === 'confirmed' && currentStatus === 'pre_order_confirmed') return true;
      return false;
    });
    activeIndex = idx !== -1 ? idx : 0;
  }

  if (activeIndex === -1) activeIndex = 0;

  return (
    <div className="space-y-6">
      <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-slate-200 dark:border-slate-800">
        {steps.map((step, idx) => {
          const isDeliveredState = currentStatus === 'delivered' && step.statusKey === 'delivered';
          const isCompleted = idx < activeIndex || isDeliveredState;
          const isCurrent = idx === activeIndex && !isDeliveredState;

          const IconComponent = step.icon;

          let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700';

          if (isCompleted) {
            if (step.isWarning) {
              badgeStyle = 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20';
            } else if (step.isError) {
              badgeStyle = 'bg-rose-600 text-white shadow-md shadow-rose-600/20';
            } else if (step.isPreOrderSpecial) {
              badgeStyle = 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30';
            } else {
              badgeStyle = 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20';
            }
          } else if (isCurrent) {
            if (step.isWarning) {
              badgeStyle = 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/40 scale-110 animate-bounce ring-4 ring-amber-400/20';
            } else if (step.isError) {
              badgeStyle = 'bg-rose-600 text-white font-black shadow-lg shadow-rose-600/40 scale-110 ring-4 ring-rose-600/20';
            } else if (step.isPreOrderSpecial) {
              badgeStyle = 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-lg shadow-purple-500/40 scale-110 ring-4 ring-purple-400/20 animate-pulse';
            } else {
              badgeStyle = 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-110 animate-pulse';
            }
          }

          return (
            <div key={step.id} className="relative group transition-all">
              {/* Timeline Node Badge Icon */}
              <div
                className={`w-8 h-8 rounded-full absolute -left-[41px] sm:-left-[49px] top-0 flex items-center justify-center transition-all ${badgeStyle}`}
              >
                {isCompleted && !step.isWarning && !step.isError ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <IconComponent className="w-4 h-4" />
                )}
              </div>

              {/* Step Title & Description */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-extrabold text-sm sm:text-base ${
                      step.isError
                        ? 'text-rose-600 dark:text-rose-400'
                        : step.isWarning
                        ? 'text-amber-600 dark:text-amber-400'
                        : isDeliveredState
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : step.isPreOrderSpecial && (isCurrent || isCompleted)
                        ? 'text-purple-600 dark:text-purple-400'
                        : isCurrent
                        ? 'text-brand-600 dark:text-brand-400'
                        : isCompleted
                        ? 'text-slate-900 dark:text-slate-100 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </h4>

                  {isDeliveredState ? (
                    <span className="px-2 py-0.2 text-[9px] font-black uppercase rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      COMPLETED
                    </span>
                  ) : isCurrent ? (
                    <span
                      className={`px-2 py-0.2 text-[9px] font-black uppercase rounded-full ${
                        step.isWarning
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                          : step.isError
                          ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
                          : step.isPreOrderSpecial
                          ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300'
                          : 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                      }`}
                    >
                      CURRENT STATE
                    </span>
                  ) : null}
                </div>

                <p
                  className={`text-xs ${
                    isCurrent || isCompleted
                      ? 'text-slate-600 dark:text-slate-300'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
