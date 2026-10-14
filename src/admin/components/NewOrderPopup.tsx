import React, { useEffect, useState } from 'react';
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

export const NewOrderPopup: React.FC<NewOrderPopupProps> = ({
  onViewOrder,
  onPrintReceipt,
}) => {
  const [event, setEvent] = useState<NewOrderNotificationEvent | null>(null);
  const [fullOrder, setFullOrder] = useState<Order | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Subscribe to RTDB new order notification events
    const unsubscribe = realtimeEventsService.subscribeToNewOrderEvents((newEvent) => {
      if (newEvent && !acknowledgedIds.has(newEvent.orderId)) {
        setEvent(newEvent);
        // Fetch authoritative order from Firestore
        ordersService.getOrderByHumanReadableId(newEvent.orderId).then((ord) => {
          if (ord) setFullOrder(ord);
        });
      }
    });

    return () => unsubscribe();
  }, [acknowledgedIds]);

  if (!event || !fullOrder || acknowledgedIds.has(event.orderId)) {
    return null;
  }

  const handleDismiss = () => {
    setAcknowledgedIds((prev) => new Set(prev).add(event.orderId));
    setEvent(null);
    setFullOrder(null);
  };

  const handleView = () => {
    onViewOrder(fullOrder);
    handleDismiss();
  };

  const handlePrint = () => {
    onPrintReceipt(fullOrder);
    handleDismiss();
  };

  return (
    <Modal isOpen={Boolean(event)} onClose={handleDismiss}>
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
