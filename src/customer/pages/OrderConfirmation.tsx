import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Order } from '../../types/order';
import { StoreSettings } from '../../types/settings';
import { ordersService } from '../../services/orders.service';
import { settingsService } from '../../services/settings.service';
import { formatINR, formatDate } from '../../utils/formatters';
import { openWhatsAppOrderLink } from '../../utils/whatsapp';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { WhatsAppTransitionModal } from '../components/WhatsAppTransitionModal';
import { useToast } from '../../contexts/ToastContext';
import { 
  CheckCircle2, 
  Copy, 
  MessageSquare, 
  Package,
  Sparkles
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useDocumentSeo } from '../hooks/useDocumentSeo';

export const OrderConfirmation: React.FC = () => {
  useDocumentSeo({
    title: 'Order Confirmed',
    noindex: true,
  });

  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(
    (location.state as any)?.order || null
  );
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(!order);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  useEffect(() => {
    settingsService.getStoreSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (order || !orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const found = await ordersService.getOrderByHumanReadableId(orderId);
        setOrder(found);
      } catch (err) {
        console.warn('[OrderConfirmation]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [order, orderId]);

  const copyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderId);
    toast.success('Copied!', `Order ID ${order.orderId} copied to clipboard.`);
  };

  const handleLaunchWhatsApp = () => {
    if (!order) return;
    setShowWhatsAppModal(false);
    openWhatsAppOrderLink(order, settings?.whatsappNumber);
  };

  if (loading) {
    return <Loading message="Retrieving order request details..." />;
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-10 space-y-4">
        <h2 className="text-xl font-bold">Order Details Unavailable</h2>
        <p className="text-sm text-slate-500">Could not find an order reference matching "{orderId}".</p>
        <Link to={ROUTES.CUSTOMER.HOME}>
          <Button size="sm">Return to Home</Button>
        </Link>
      </div>
    );
  }

  const isPreOrder = Boolean(
    order.isPreOrder ||
    order.orderType === 'pre_order' ||
    order.orderType === 'mixed' ||
    order.items?.some((i) => i.isPreOrder)
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12 relative z-10">
      {/* Success Hero Header */}
      <Card glass className={`p-8 text-center space-y-4 rounded-3xl glass-card-3d shadow-xl ${
        isPreOrder 
          ? 'border-purple-300/60 dark:border-purple-800/60' 
          : 'border-emerald-200/60 dark:border-emerald-900/60'
      }`}>
        <div className={`mx-auto w-16 h-16 rounded-3xl text-white flex items-center justify-center shadow-lg animate-bounce ${
          isPreOrder
            ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-500/30'
            : 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/30'
        }`}>
          {isPreOrder ? <Sparkles className="w-9 h-9" /> : <CheckCircle2 className="w-9 h-9" />}
        </div>

        <div className="space-y-1">
          <Badge 
            variant={isPreOrder ? 'neutral' : 'success'} 
            className={`text-xs px-3 py-1 mb-1 ${
              isPreOrder 
                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700' 
                : ''
            }`}
          >
            {isPreOrder 
              ? (order.orderType === 'mixed' ? 'Mixed Order (Includes Pre-Order)' : '✨ Pre-Order Request Received') 
              : 'Order Request Received'}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Thank You, {order.customerInfo.fullName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">
            {isPreOrder
              ? 'Your pre-order booking request has been successfully registered with Diyas N Duas. Our artisans will handcraft and prepare your items once confirmed!'
              : (settings?.orderConfirmationNote ||
                'Your diyas order request has been received by Diyas N Duas. Our team will contact you shortly to confirm stock and delivery.')}
          </p>
        </div>

        {/* Order Reference Box */}
        <div className="p-4 rounded-2xl glass-surface space-y-2 inline-block w-full max-w-md">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
            Unique Order Reference ID
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-xl sm:text-2xl font-mono font-black ${
              isPreOrder ? 'text-purple-600 dark:text-purple-400' : 'text-brand-600 dark:text-brand-400'
            }`}>
              {order.orderId}
            </span>
            <button
              onClick={copyOrderId}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 hover:text-brand-500 shadow-xs transition-colors"
              title="Copy Order Reference"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WhatsApp & Tracking Direct Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => setShowWhatsAppModal(true)}
            className="w-full sm:w-auto font-extrabold btn-shine-sweep bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 border-none rounded-2xl"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            <span>Send Order on WhatsApp</span>
          </Button>

          <Link to={`${ROUTES.CUSTOMER.TRACK_ORDER}?orderId=${order.orderId}`} className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold rounded-2xl">
              <Package className="w-4 h-4 mr-2" />
              <span>Track Order Status</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Order Item Snapshots & Summary */}
      <Card glass className="p-6 space-y-4 rounded-3xl glass-card-3d">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Order Summary</h3>
          <span className="text-xs text-slate-400">{formatDate(order.createdAt)}</span>
        </div>

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
              <div className="flex items-center gap-3">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                )}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h4>
                    {item.isPreOrder && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200">
                        <Sparkles className="w-2.5 h-2.5" /> Pre-Order
                      </span>
                    )}
                  </div>
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
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline text-sm">
            <span className="font-bold">Total Amount</span>
            <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{formatINR(order.total)}</span>
          </div>
        </div>
      </Card>

      {/* Customer Information Summary */}
      <Card glass className="p-6 space-y-3 text-xs sm:text-sm rounded-3xl glass-card-3d">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-800">
          Delivery & Contact Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300 font-medium">
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

      {/* WhatsApp Transition Modal */}
      <WhatsAppTransitionModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        order={order}
        onConfirmWhatsApp={handleLaunchWhatsApp}
      />
    </div>
  );
};
