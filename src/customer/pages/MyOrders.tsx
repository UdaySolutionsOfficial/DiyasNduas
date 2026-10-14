import React, { useEffect, useState } from 'react';
import { localStorageUtil, RecentOrderReference } from '../../utils/localStorage';
import { ordersService } from '../../services/orders.service';
import { Order } from '../../types/order';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDate } from '../../utils/formatters';
import { Package, Trash2, Eye, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useToast } from '../../contexts/ToastContext';

export const MyOrders: React.FC = () => {
  const [recentRefs, setRecentRefs] = useState<RecentOrderReference[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const loadLocalOrders = async () => {
    setLoading(true);
    const refs = localStorageUtil.getRecentOrders();
    setRecentRefs(refs);

    try {
      const loaded = await Promise.all(
        refs.map((r) => ordersService.getOrderById(r.orderId))
      );
      
      const validOrders = loaded.filter(Boolean) as Order[];
      setOrders(validOrders);

      // Clean up orphaned local references that no longer exist anywhere in DB
      const validIds = new Set(validOrders.map(o => o.orderId.toUpperCase()));
      const cleanedRefs = refs.filter(r => validIds.has(r.orderId.trim().toUpperCase()));

      if (cleanedRefs.length !== refs.length) {
        localStorage.setItem('ck_recent_orders_v1', JSON.stringify(cleanedRefs));
        setRecentRefs(cleanedRefs);
        window.dispatchEvent(new Event('ck_recent_orders_updated'));
      }
    } catch (err) {
      console.warn('[MyOrders]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocalOrders();
  }, []);

  const handleRemoveFromDevice = (orderId: string) => {
    const updated = recentRefs.filter((r) => r.orderId !== orderId);
    setRecentRefs(updated);
    setOrders((prev) => prev.filter((o) => o.orderId !== orderId && o.id !== orderId));
    localStorage.setItem('ck_recent_orders_v1', JSON.stringify(updated));
    window.dispatchEvent(new Event('ck_recent_orders_updated'));
    toast.info('Order Removed', `Order #${orderId} removed from this device.`);
  };

  if (!loading && (!recentRefs || recentRefs.length === 0 || orders.length === 0)) {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-fade-in">
        <EmptyState
          icon={<Package className="w-10 h-10 text-brand-500" />}
          title="No Orders on This Device"
          description="You haven't placed any order requests from this browser yet, or past local records were cleared."
          actionText="EXPLORE PRODUCTS"
          onAction={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your Order History</h1>
          <p className="text-sm text-slate-500">Persistent order history saved for this browser.</p>
        </div>

        <Button size="sm" variant="ghost" onClick={loadLocalOrders} isLoading={loading} title="Refresh Status">
          <RefreshCw className="w-4 h-4 mr-1.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="space-y-3.5">
        {orders.map((order) => {
          let badgeVariant: 'warning' | 'brand' | 'success' | 'danger' | 'neutral' = 'brand';
          if (order.orderStatus === 'pending') badgeVariant = 'warning';
          else if (order.orderStatus === 'delivered' || order.orderStatus === 'ready') badgeVariant = 'success';
          else if (order.orderStatus === 'cancelled') badgeVariant = 'danger';

          return (
            <Card key={order.id} glass className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-brand-600 dark:text-brand-400 text-base">
                    {order.orderId}
                  </span>
                  <Badge variant={badgeVariant} className="text-[10px] uppercase">
                    {order.orderStatus.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="text-xs text-slate-500">
                  Placed on {formatDate(order.createdAt)} • {order.itemCount} items
                </div>

                <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Total Bill: {formatINR(order.total)}
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <Link to={`/order/${order.orderId}`}>
                  <Button size="sm" variant="primary" className="font-bold text-xs">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    <span>Track Status</span>
                  </Button>
                </Link>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveFromDevice(order.orderId)}
                  className="text-slate-400 hover:text-rose-600 p-2"
                  title="Remove order record from this device"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
