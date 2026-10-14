import React, { useEffect, useState } from 'react';
import { productsService } from '../../services/products.service';
import { ordersService } from '../../services/orders.service';
import { settingsService } from '../../services/settings.service';
import { Product } from '../../types/product';
import { Order } from '../../types/order';
import { StoreSettings } from '../../types/settings';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { formatINR, formatDate } from '../../utils/formatters';
import { 
  Package, 
  ShoppingBag, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  Eye,
  Store,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [prods, ords, sets] = await Promise.all([
          productsService.getAllProducts(),
          ordersService.getAllOrders(),
          settingsService.getStoreSettings(),
        ]);
        setProducts(prods);
        setOrders(ords);
        setSettings(sets);
      } catch (err) {
        console.warn('[Admin Dashboard]', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return <Loading message="Loading Diyas N Duas Dashboard..." />;
  }

  // Dashboard summary metrics
  const activeProducts = products.filter((p) => p.isActive).length;
  const lowStockProducts = products.filter((p) => p.isActive && p.stockQuantity <= 10);
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => o.createdAt >= todayStart.getTime());
  const todaySalesValue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Admin Overview Dashboard</h1>
          <p className="text-sm text-slate-500">Live operational overview for Diyas N Duas store.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={ROUTES.ADMIN.SETTINGS}>
            <Button size="sm" variant="secondary" className="font-bold">
              <Settings className="w-4 h-4 mr-1.5" />
              <span>Store Controls</span>
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN.ORDERS}>
            <Button size="sm" variant="primary" className="font-bold">
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              <span>Manage Orders ({pendingOrders.length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Store Status Operational Indicator Widget */}
      {settings && (
        <Card glass className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-brand-200/60 dark:border-brand-900/60 bg-gradient-to-r from-brand-50/50 via-white to-blue-50/50 dark:from-brand-950/30 dark:via-slate-900 dark:to-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                {settings.storeName} Live Status
              </h3>
              <p className="text-xs text-slate-500">{settings.contactPhone} • {settings.storeAddress}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5">
              <span>Store Status:</span>
              {settings.isStoreOpen ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">● OPEN</span>
              ) : (
                <span className="text-rose-600 font-extrabold">● CLOSED</span>
              )}
            </div>

            <div className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5">
              <span>Ordering:</span>
              {settings.acceptingOrders ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">● ACTIVE</span>
              ) : (
                <span className="text-amber-600 font-extrabold">● SUSPENDED</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Summary Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card glass className="p-4 space-y-2 border-brand-200/60 dark:border-brand-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Products</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{activeProducts}</span>
        </Card>

        <Card glass className="p-4 space-y-2 border-amber-200/60 dark:border-amber-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{pendingOrders.length}</span>
        </Card>

        <Card glass className="p-4 space-y-2 border-emerald-200/60 dark:border-emerald-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Orders</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{todayOrders.length}</span>
        </Card>

        <Card glass className="p-4 space-y-2 border-blue-200/60 dark:border-blue-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Value</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{formatINR(todaySalesValue)}</span>
        </Card>

        <Card glass className="p-4 space-y-2 border-rose-200/60 dark:border-rose-900/60 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{lowStockProducts.length}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base">Recent Order Requests</h3>
            <Link to={ROUTES.ADMIN.ORDERS} className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {orders.slice(0, 5).map((order) => (
              <Card key={order.id} glass className="p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-brand-600 dark:text-brand-400">{order.orderId}</span>
                    <Badge variant={order.orderStatus === 'pending' ? 'warning' : 'brand'} className="text-[10px] py-0">
                      {order.orderStatus}
                    </Badge>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{order.customerInfo.fullName}</div>
                  <div className="text-slate-400 text-[11px]">{formatDate(order.createdAt)} • {order.itemCount} items</div>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-black text-slate-900 dark:text-slate-100 text-base block">
                    {formatINR(order.total)}
                  </span>
                  <Link to={ROUTES.ADMIN.ORDERS}>
                    <Button size="sm" variant="ghost" className="text-xs py-0.5 h-7">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Details</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts Box */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-base">Low Stock Attention</h3>
          <Card glass className="p-4 space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">All active products have adequate stock levels.</p>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-none">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</h4>
                    <span className="text-rose-500 font-semibold text-[11px]">Only {p.stockQuantity} remaining</span>
                  </div>
                  <Link to={ROUTES.ADMIN.PRODUCTS}>
                    <Button size="sm" variant="secondary" className="text-xs py-1 px-2.5">
                      Update Stock
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
