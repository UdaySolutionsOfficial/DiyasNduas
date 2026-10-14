import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types/order';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { formatINR, formatDate } from '../../utils/formatters';
import { Printer, MessageSquare, Phone, AlertTriangle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { env } from '../../config/env';

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

  const statusOptions = [
    { label: 'Pending Store Confirmation', value: 'pending' },
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
      await onUpdateStatus(order.id, newStatus, `Status updated to ${newStatus} by admin`);
      toast.success('Status Updated', `Order #${order.orderId} status changed to ${newStatus}.`);
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
      await onUpdateStatus(order.id, 'cancelled', 'Order cancellation approved by store admin (stock restored)');
      toast.info('Order Cancelled', `Order #${order.orderId} cancelled & stock restored.`);
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
      await onUpdateStatus(order.id, 'confirmed', 'Customer cancellation request was rejected by store admin.');
      toast.info('Request Rejected', `Cancellation request rejected. Order #${order.orderId} status set to Confirmed.`);
    } catch (err) {
      console.error('[Reject Cancel Error]', err);
    } finally {
      setUpdating(false);
    }
  };

  // WhatsApp Customer Confirmation Message Deep Link
  const handleConfirmAndMessageCustomer = async () => {
    try {
      await handleStatusChange('confirmed');
      const phone = order.customerInfo.phone.replace(/[^0-9]/g, '');
      const formattedPhone = phone.length === 10 ? `91${phone}` : phone;

      const message = `Hello ${order.customerInfo.fullName},

Your order request has been CONFIRMED by ${env.store.name}!

*Order Reference:* ${order.orderId}
*Total Bill:* ${formatINR(order.total)}
*Status:* Confirmed

We are currently preparing your transport parcel. We will contact you for payment & delivery updates.

Thank you!`;

      const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.warn('[WhatsApp Notice]', err);
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
                  Approve Cancellation (Restore Stock)
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

          {/* Top Status & Date Header */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase">Order Reference</span>
              <span className="font-mono font-black text-xl text-brand-600 dark:text-brand-400">{order.orderId}</span>
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
                      <h5 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h5>
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

          {/* Direct Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmAndMessageCustomer}
              isLoading={updating}
              className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 border-none"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span>Confirm & Message Customer</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onPrintReceipt(order)}
              className="font-bold"
            >
              <Printer className="w-4 h-4 mr-2" />
              <span>Print Receipt</span>
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancelOrder}
        title="Cancel Order & Restore Stock"
        message={`Are you sure you want to cancel order #${order.orderId}? This will automatically restore the ordered item quantities back into product stock.`}
        confirmText="Cancel Order & Restore Stock"
        isDestructive
      />
    </>
  );
};
