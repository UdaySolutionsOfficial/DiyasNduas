import React, { useEffect, useState, useRef } from 'react';
import { realtimeEventsService, NewOrderNotificationEvent } from '../../services/realtimeEvents.service';
import { ordersService } from '../../services/orders.service';
import { Order } from '../../types/order';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatINR } from '../../utils/formatters';
import { Sparkles, Eye, Printer, X } from 'lucide-react';

export interface NewOrderPopupProps {
  onViewOrder: (order: Order) => void;
  onPrintReceipt: (order: Order) => void;
}

const ACK_STORAGE_KEY = 'dnd_acknowledged_order_popups';

const loadAcknowledgedIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(ACK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    console.warn('[NewOrderPopup] Failed to read acknowledged IDs from localStorage:', e);
  }
  return new Set();
};

const persistAcknowledgedId = (orderId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const currentSet = loadAcknowledgedIds();
    currentSet.add(orderId);
    // Retain the last 100 acknowledged order IDs to prevent unbounded memory growth
    const arr = Array.from(currentSet).slice(-100);
    localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('[NewOrderPopup] Failed to save acknowledged ID to localStorage:', e);
  }
};

export const NewOrderPopup: React.FC<NewOrderPopupProps> = ({
  onViewOrder,
  onPrintReceipt,
}) => {
  const [event, setEvent] = useState<NewOrderNotificationEvent | null>(null);
  const [fullOrder, setFullOrder] = useState<Order | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(loadAcknowledgedIds);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const acknowledgeOrder = (orderId: string) => {
    persistAcknowledgedId(orderId);
    setAcknowledgedIds((prev) => new Set(prev).add(orderId));
    // Clear latest order from RTDB if matching to protect other admin tabs
    realtimeEventsService.clearLatestOrderIfMatches(orderId).catch(() => {});
  };

  useEffect(() => {
    // Subscribe to RTDB new order notification events
    const unsubscribe = realtimeEventsService.subscribeToNewOrderEvents(async (newEvent) => {
      if (!newEvent || !newEvent.orderId) return;

      const orderId = newEvent.orderId;

      // 1. If already acknowledged in state or localStorage, ignore completely
      const currentAck = loadAcknowledgedIds();
      if (currentAck.has(orderId) || acknowledgedIds.has(orderId)) {
        return;
      }

      // 2. Fetch authoritative order to inspect true status
      try {
        const ord = await ordersService.getOrderByHumanReadableId(orderId);
        if (!isMountedRef.current) return;

        // If order no longer exists or couldn't be loaded, do nothing
        if (!ord) return;

        // 3. STRICT STATUS GUARD:
        // A "NEW ORDER" popup is ONLY allowed if the order is genuinely 'pending'.
        // If it was already confirmed, processing, ready, delivered, or cancelled,
        // it must NEVER appear as a popup. Automatically acknowledge and dismiss.
        if (ord.orderStatus !== 'pending') {
          acknowledgeOrder(orderId);
          return;
        }

        // Double check acknowledgment in case it changed during async fetch
        if (loadAcknowledgedIds().has(orderId)) return;

        setFullOrder(ord);
        setEvent(newEvent);
      } catch (err) {
        console.warn('[NewOrderPopup] Failed to inspect order status:', err);
      }
    });

    return () => unsubscribe();
  }, [acknowledgedIds]);

  if (!event || !fullOrder || acknowledgedIds.has(event.orderId)) {
    return null;
  }

  const handleDismiss = () => {
    if (event) {
      acknowledgeOrder(event.orderId);
    }
    setEvent(null);
    setFullOrder(null);
  };

  const handleView = () => {
    if (event && fullOrder) {
      acknowledgeOrder(event.orderId);
      onViewOrder(fullOrder);
    }
    setEvent(null);
    setFullOrder(null);
  };

  const handlePrint = () => {
    if (event && fullOrder) {
      acknowledgeOrder(event.orderId);
      onPrintReceipt(fullOrder);
    }
    setEvent(null);
    setFullOrder(null);
  };

  return (
    <Modal isOpen={Boolean(event && fullOrder)} onClose={handleDismiss}>
      <div className="space-y-5 animate-scale-in">
        {/* Header Alert Icon */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">NEW ORDER RECEIVED!</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Live customer order request received via Realtime Database.
            </p>
          </div>
        </div>

        {/* Order Reference Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-sm">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Reference</span>
            <span className="font-mono font-black text-brand-600 dark:text-brand-400 text-base">
              {fullOrder.orderId}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Customer Name:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{fullOrder.customerInfo.fullName}</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Mobile Phone:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{fullOrder.customerInfo.phone}</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Items Ordered:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{fullOrder.itemCount} items</span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline font-black text-base">
            <span>Total:</span>
            <span className="text-xl text-brand-600 dark:text-brand-400">{formatINR(fullOrder.total)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button onClick={handleView} variant="primary" size="md" className="flex-1 font-bold">
            <Eye className="w-4 h-4 mr-2" />
            <span>View Details</span>
          </Button>

          <Button onClick={handlePrint} variant="secondary" size="md" className="flex-1 font-bold">
            <Printer className="w-4 h-4 mr-2" />
            <span>Print Receipt</span>
          </Button>

          <Button onClick={handleDismiss} variant="ghost" size="md" className="px-3">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
