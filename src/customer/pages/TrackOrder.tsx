import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ordersService } from '../../services/orders.service';
import { Order, OrderStatus } from '../../types/order';
import { OrderStatusTimeline } from '../components/OrderStatusTimeline';
import { ReceiptModal } from '../../admin/components/ReceiptModal';
import { CancelRequestModal } from '../components/CancelRequestModal';
import { localStorageUtil, RecentOrderReference } from '../../utils/localStorage';
import { formatINR, formatDate } from '../../utils/formatters';
import { openWhatsAppSupportLink } from '../../utils/whatsapp';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { settingsService } from '../../services/settings.service';
import { StoreSettings } from '../../types/settings';
import { Search, Package, Printer, MessageSquare, Copy, Phone, HelpCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useDocumentSeo } from '../hooks/useDocumentSeo';

export const TrackOrder: React.FC = () => {
  useDocumentSeo({
    title: 'Track Your Order Status',
    description: 'Check the real-time shipping and packaging status of your Diyas N Duas order using your order ID.',
    canonicalPath: '/order',
    ogImage: 'https://diyasnduas.com/og-home.jpg',
    ogImageAlt: 'Diyas N Duas Order Tracking',
  });

  const { orderId: routeOrderId } = useParams<{ orderId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId') || searchParams.get('id') || searchParams.get('order') || '';

  const activeOrderId = routeOrderId || queryOrderId || '';

  const [inputOrderId, setInputOrderId] = useState(activeOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(activeOrderId));
  const [searched, setSearched] = useState(Boolean(activeOrderId));

  useEffect(() => {
    if (activeOrderId) {
      setInputOrderId(activeOrderId);
      setSearched(true);
      setLoading(true);
    }
  }, [activeOrderId]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderReference[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const toast = useToast();

  useEffect(() => {
    setRecentOrders(localStorageUtil.getRecentOrders());
    const unsubscribeSettings = settingsService.subscribeToStoreSettings(setSettings);
    return () => unsubscribeSettings();
  }, []);

  // Realtime Single Order Subscription
  useEffect(() => {
    const targetId = (activeOrderId || inputOrderId).trim();
    if (!targetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    let prevStatus: OrderStatus | null = null;

    const unsubscribe = ordersService.subscribeToOrder(targetId, (updatedOrder) => {
      setOrder(updatedOrder);
      setLoading(false);

      if (updatedOrder) {
        if (prevStatus && prevStatus !== updatedOrder.orderStatus) {
          toast.info(
            'Order Status Updated',
            `Order #${updatedOrder.orderId} status changed to "${updatedOrder.orderStatus}".`
          );
        }
        prevStatus = updatedOrder.orderStatus;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputOrderId.trim()) return;
    setSearchParams({ orderId: inputOrderId.trim() });
  };

  const copyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderId);
    toast.success('Copied!', `Order ID ${order.orderId} copied to clipboard.`);
  };

  const isCancelable = order?.orderStatus === 'pending' || order?.orderStatus === 'confirmed';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Track Customer Order Request</h1>
        <p className="text-sm text-slate-500">Live order status updates & delivery progress timeline.</p>
      </div>

      {/* Order Search Box */}
      <Card glass className="p-6 space-y-4 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Package className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={inputOrderId}
              onChange={(e) => setInputOrderId(e.target.value)}
              placeholder="e.g. CK-240826-58921"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" isLoading={loading} size="md">
            <Search className="w-4 h-4 mr-1.5" />
            <span>Track</span>
          </Button>
        </form>

        {/* Local Recent Orders History Shortcuts */}
        {recentOrders.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Recent Orders on this Device
            </span>
            <div className="flex flex-wrap gap-2">
              {recentOrders.map((ref) => (
                <button
                  key={ref.orderId}
                  onClick={() => {
                    setInputOrderId(ref.orderId);
                    setSearchParams({ orderId: ref.orderId });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                >
                  {ref.orderId} ({formatINR(ref.totalAmount)})
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {loading && <Loading message="Retrieving live order status..." />}

      {!loading && searched && order && (
        <div className="space-y-6">
          {/* Cancellation Pending Banner */}
          {order.orderStatus === 'cancel_requested' && (
            <Card className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1.5 rounded-2xl">
              <div className="flex items-center gap-2 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Order Cancellation Request Initiated</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                You requested to cancel this order. Reason: <strong>"{order.cancellationReason || 'No reason provided'}"</strong>.
                Our store admin will review and process your request shortly.
              </p>
            </Card>
          )}

          {/* Order Header Card */}
          <Card glass className="p-6 space-y-4 shadow-xl border-brand-200/60 dark:border-brand-900/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Order Reference
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-black text-brand-600 dark:text-brand-400">
                    {order.orderId}
                  </span>
                  <button
                    onClick={copyOrderId}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-500"
                    title="Copy Order Reference"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-400">{formatDate(order.createdAt)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setShowReceipt(true)}>
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  <span>View Receipt</span>
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => openWhatsAppSupportLink(order)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  <span>WhatsApp</span>
                </Button>

                {isCancelable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCancelModal(true)}
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Cancel Order</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Visual Status Progress Timeline */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Live Order Progress</h4>
              <OrderStatusTimeline 
                currentStatus={order.orderStatus} 
                statusHistory={order.statusHistory}
                cancellationReason={order.cancellationReason}
              />
            </div>
          </Card>

          {/* Customer Support Helpline Card */}
          <Card glass className="p-4 space-y-3 bg-gradient-to-br from-amber-500/5 to-brand-500/5 border border-amber-500/20 rounded-2xl">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-slate-100">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Need Help with this Order?</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Have questions about your diyas package or delivery timing? Contact our support team directly.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`tel:${(settings?.contactPhone || settings?.whatsappNumber || '+91 9177536399').replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Call Store ({settings?.contactPhone || settings?.whatsappNumber || '+91 9177536399'})</span>
              </a>

              <button
                type="button"
                onClick={() => openWhatsAppSupportLink(order)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>
          </Card>

          {/* Ordered Items Breakdown */}
          <Card glass className="p-6 space-y-4">
            <h3 className="font-extrabold text-base border-b border-slate-200 dark:border-slate-800 pb-3">
              Ordered Products
            </h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h4>
                      <span className="text-slate-400">Qty: {item.quantity} × {formatINR(item.unitPrice)}</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 dark:text-slate-100">{formatINR(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatINR(order.subtotal)}</span>
              </div>

              {order.couponCode && order.couponDiscount ? (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Coupon Discount ({order.couponCode})</span>
                  <span>- {formatINR(order.couponDiscount)}</span>
                </div>
              ) : null}

              {order.taxAmount && order.taxAmount > 0 ? (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>{order.taxName || 'GST'} ({order.taxRate || 5}%)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">+{formatINR(order.taxAmount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Delivery Fee</span>
                {order.deliveryFee === 0 ? (
                  <span className="font-black text-emerald-600 dark:text-emerald-400">FREE</span>
                ) : (
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatINR(order.deliveryFee)}</span>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline font-black text-sm">
                <span>Total Amount</span>
                <span className="text-2xl text-brand-600 dark:text-brand-400">{formatINR(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Customer Delivery Details */}
          <Card glass className="p-6 space-y-3 text-xs sm:text-sm">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-800">
              Delivery Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-slate-400 text-xs block">Customer Name</span>
                <span className="font-semibold">{order.customerInfo.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Mobile Phone</span>
                <span className="font-semibold">{order.customerInfo.phone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 text-xs block">Delivery / Local Address</span>
                <span className="font-semibold">{order.customerInfo.address}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!loading && searched && !order && (
        <EmptyState
          icon={<Package className="w-8 h-8 text-amber-500" />}
          title="Order Not Found"
          description={`We couldn't find an order matching "${inputOrderId}". Please check your order reference and try again.`}
        />
      )}

      <ReceiptModal order={showReceipt ? order : null} onClose={() => setShowReceipt(false)} />
      <CancelRequestModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        orderId={order?.orderId || ''}
        onSuccess={() => {
          if (order) setOrder({ ...order, orderStatus: 'cancel_requested' });
        }}
      />
    </div>
  );
};
