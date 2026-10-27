import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types/order';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { formatINR, formatDate } from '../../utils/formatters';
import { 
  Printer, 
  MessageSquare, 
  Phone, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  PackageCheck, 
  Truck, 
  XCircle, 
  Clock 
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { openWhatsAppStatusMessageLink } from '../../utils/whatsapp';

export interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
  onPrintReceipt: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onPrintReceipt,
}) => {
  const [updating, setUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order?.orderStatus || 'pending');
  const toast = useToast();

  React.useEffect(() => {
    if (order?.orderStatus) {
      setSelectedStatus(order.orderStatus);
    }
  }, [order?.orderStatus]);

  if (!order) return null;

  const isPreOrder = Boolean(
    order.isPreOrder ||
    order.orderType === 'pre_order' ||
    order.orderType === 'mixed' ||
    order.items?.some((i) => i.isPreOrder)
  );

  const statusOptions = [
    { label: 'Pending Store Confirmation', value: 'pending' },
    { label: '✨ Pre-Order Accepted', value: 'pre_order_confirmed' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Packaging / Processing', value: 'processing' },
    { label: 'Ready for Transport', value: 'ready' },
    { label: 'Delivered / Fulfilled', value: 'delivered' },
    { label: 'Cancel Requested by Customer', value: 'cancel_requested' },
    { label: 'Cancelled (Restore Stock)', value: 'cancelled' },
  ];

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setSelectedStatus(newStatus);

    if (newStatus === 'cancelled') {
      setShowCancelDialog(true);
      return;
    }

    try {
      setUpdating(true);
      const note = newStatus === 'pre_order_confirmed'
        ? 'Pre-order request accepted by store admin. Crafting initiated.'
        : `Status updated to ${newStatus} by admin`;

      await onUpdateStatus(order.id, newStatus, note);
    } catch (err) {
      console.error('[OrderDetailsModal]', err);
      setSelectedStatus(order.orderStatus);
      toast.error('Update Failed', 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmCancelOrder = async () => {
    try {
      setUpdating(true);
      await onUpdateStatus(
        order.id,
        'cancelled',
        order.isPreOrder
          ? 'Pre-order cancelled by store admin.'
          : 'Order cancellation approved by store admin (stock restored)'
      );
      toast.info('Order Cancelled', `Order #${order.orderId} cancelled.`);
      setShowCancelDialog(false);
    } catch (err) {
      console.error('[Cancel Order Error]', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectCancelRequest = async () => {
    try {
      setUpdating(true);
      const resumeStatus: OrderStatus = isPreOrder ? 'pre_order_confirmed' : 'confirmed';
      await onUpdateStatus(order.id, resumeStatus, 'Customer cancellation request was rejected by store admin.');
      toast.info('Request Rejected', `Cancellation request rejected. Order #${order.orderId} status set to ${resumeStatus}.`);
    } catch (err) {
      console.error('[Reject Cancel Error]', err);
    } finally {
      setUpdating(false);
    }
  };

  // Dynamic WhatsApp button configuration corresponding to the selected order status
  const getStatusButtonConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Send Order Received Message',
          icon: Clock,
          colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
        };
      case 'pre_order_confirmed':
        return {
          label: 'Send Pre-Order Accepted Message',
          icon: Sparkles,
          colorClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/20',
        };
      case 'confirmed':
        return {
          label: 'Send Order Confirmed Message',
          icon: CheckCircle2,
          colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
        };
      case 'processing':
        return {
          label: 'Send Packaging Update Message',
          icon: PackageCheck,
          colorClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
        };
      case 'ready':
        return {
          label: 'Send Ready for Transport Message',
          icon: Truck,
          colorClass: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20',
        };
      case 'delivered':
        return {
          label: 'Send Order Delivered Message',
          icon: Check,
          colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
        };
      case 'cancel_requested':
        return {
          label: 'Send Cancellation Review Message',
          icon: AlertTriangle,
          colorClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
        };
      case 'cancelled':
        return {
          label: 'Send Order Cancelled Notice',
          icon: XCircle,
          colorClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
        };
      default:
        return {
          label: 'Send WhatsApp Status Update',
          icon: MessageSquare,
          colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
        };
    }
  };

  const buttonConfig = getStatusButtonConfig(selectedStatus);
  const StatusButtonIcon = buttonConfig.icon;

  // Sends the pre-filled professional WhatsApp notification for the currently selected status
  const handleSendStatusWhatsAppMessage = async () => {
    try {
      if (order.orderStatus !== selectedStatus && selectedStatus !== 'cancelled') {
        await handleStatusChange(selectedStatus);
      }
      openWhatsAppStatusMessageLink({ ...order, orderStatus: selectedStatus }, selectedStatus);
    } catch (err) {
      console.warn('[WhatsApp Status Send Error]', err);
    }
  };

  return (
    <>
      <Modal isOpen={Boolean(order)} onClose={onClose} title={`Order Request #${order.orderId}`}>
        <div className="space-y-6">
          {/* Customer Cancellation Request Alert Banner */}
          {order.orderStatus === 'cancel_requested' && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-3">
              <div className="flex items-center gap-2 font-black text-rose-700 dark:text-rose-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Customer Requested Order Cancellation</span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-200">
                Reason given by customer: <strong>"{order.cancellationReason || 'No reason provided'}"</strong>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleConfirmCancelOrder}
                  isLoading={updating}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border-none"
                >
                  Approve Cancellation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRejectCancelRequest}
                  isLoading={updating}
                  className="font-bold text-xs"
                >
                  Reject Request & Resume Order
                </Button>
              </div>
            </div>
          )}

          {/* Pre-Order Tag Notice */}
          {isPreOrder && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-purple-900 dark:text-purple-200 block">
                  {order.orderType === 'mixed' ? 'Mixed Order (In-Stock + Pre-Order)' : 'Customer Pre-Order Booking'}
                </span>
                <span className="text-purple-700/80 dark:text-purple-300/80">
                  This order contains out-of-stock item(s) booked in advance. Confirming moves status to "Pre-Order Accepted".
                </span>
              </div>
            </div>
          )}

          {/* Top Status & Date Header */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase">Order Reference</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-xl text-brand-600 dark:text-brand-400">{order.orderId}</span>
                {isPreOrder && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-2.5 h-2.5" />
                    {order.orderType === 'mixed' ? 'Mixed' : 'Pre-Order'}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 block mt-0.5">{formatDate(order.createdAt)}</span>
            </div>

            <div className="w-full sm:w-auto space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase">Manage Status</span>
              <Select
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                disabled={updating}
                className="text-xs py-1.5 font-bold"
              />
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60 space-y-2 text-xs sm:text-sm">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400">
              <Phone className="w-3.5 h-3.5" /> Customer Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-400 text-xs block">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{order.customerInfo.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Mobile Phone</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{order.customerInfo.phone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 text-xs block">Delivery / Local Address</span>
                <span className="font-semibold">{order.customerInfo.address}</span>
              </div>
              {order.customerInfo.notes && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-xs block">Customer Note</span>
                  <span className="italic text-slate-600 dark:text-slate-400">"{order.customerInfo.notes}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Ordered Item Snapshots Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ordered Products</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-200" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h5>
                        {item.isSpecialOffer ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300">
                            <Sparkles className="w-2.5 h-2.5" /> Special Milestone Offer
                          </span>
                        ) : item.isPreOrder ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200">
                            <Sparkles className="w-2.5 h-2.5" /> Pre-Order
                          </span>
                        ) : null}
                      </div>
                      <span className="text-slate-400">Qty: {item.quantity} × {formatINR(item.unitPrice)}</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 dark:text-slate-100">{formatINR(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(order.subtotal)}</span>
              </div>
              {order.couponCode && order.couponDiscount ? (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Discount ({order.couponCode}):</span>
                  <span>- {formatINR(order.couponDiscount)}</span>
                </div>
              ) : null}
              {order.taxAmount && order.taxAmount > 0 ? (
                <div className="flex justify-between items-center text-slate-500">
                  <span>{order.taxName || 'GST'} ({order.taxRate || 5}%):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">+{formatINR(order.taxAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between items-center text-slate-500">
                <span>Delivery Fee:</span>
                {order.deliveryFee === 0 ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                ) : (
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(order.deliveryFee)}</span>
                )}
              </div>
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline font-black text-sm">
                <span>Total Bill:</span>
                <span className="text-2xl text-brand-600 dark:text-brand-400">{formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Direct Actions: Dynamic Status WhatsApp Message Button & Receipt Print */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleSendStatusWhatsAppMessage}
              isLoading={updating}
              className={`flex-1 font-bold ${buttonConfig.colorClass} shadow-md border-none`}
            >
              <StatusButtonIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{buttonConfig.label}</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onPrintReceipt(order)}
              className="font-bold"
            >
              <Printer className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Print Receipt</span>
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancelOrder}
        title="Cancel Order"
        message={`Are you sure you want to cancel order #${order.orderId}? ${
          order.isPreOrder
            ? 'Pre-ordered items will be marked cancelled without altering stock count.'
            : 'This will automatically restore the ordered item quantities back into product stock.'
        }`}
        confirmText="Cancel Order"
        isDestructive
      />
    </>
  );
};
