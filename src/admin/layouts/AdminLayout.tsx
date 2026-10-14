import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Image as ImageIcon, 
  FolderTree, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Store,
  Megaphone,
  Receipt
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { NewOrderPopup } from '../components/NewOrderPopup';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { Order, OrderStatus } from '../../types/order';
import { ordersService } from '../../services/orders.service';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const [activePopupOrder, setActivePopupOrder] = useState<Order | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  const navItems = [
    { label: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
    { label: 'Products', path: ROUTES.ADMIN.PRODUCTS, icon: Package },
    { label: 'Orders', path: ROUTES.ADMIN.ORDERS, icon: ShoppingBag },
    { label: 'Taxes & Coupons', path: ROUTES.ADMIN.TAXES, icon: Receipt },
    { label: 'Banners', path: ROUTES.ADMIN.BANNERS, icon: ImageIcon },
    { label: 'Notices', path: ROUTES.ADMIN.ANNOUNCEMENTS, icon: Megaphone },
    { label: 'Categories', path: ROUTES.ADMIN.CATEGORIES, icon: FolderTree },
    { label: 'Settings', path: ROUTES.ADMIN.SETTINGS, icon: Settings },
  ];

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    await ordersService.updateOrderStatus(orderId, newStatus, note);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Admin Sidebar Navigation */}
      <aside className="no-print hidden md:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sticky top-0 h-screen justify-between flex-shrink-0 z-30">
        <div className="space-y-6">
          {/* Admin Brand Logo Header */}
          <Link to={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-2.5 px-2 group">
            <img
              src="/logo.png"
              alt="Diyas N Duas Logo"
              className="w-10 h-10 rounded-full object-cover shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50"
            />
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-amber-300 dark:via-amber-400 dark:to-amber-200 bg-clip-text text-transparent block">
                DIYAS N DUAS
              </span>
              <span className="block text-[9px] tracking-widest text-slate-400 font-bold uppercase -mt-1">
                Store Control Center
              </span>
            </div>
          </Link>

          {/* Navigation Links List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            to={ROUTES.CUSTOMER.HOME}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Open Customer Store</span>
          </Link>

          <div className="flex items-center justify-between px-2 pt-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Admin Header Navigation */}
      <div className="no-print md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <Link to={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-2">
          <img src="/logo.png" alt="Diyas N Duas Logo" className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-400" />
          <span className="font-extrabold text-sm tracking-tight">DIYAS N DUAS ADMIN</span>
        </Link>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <button onClick={logout} className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Touch Mobile Navigation Bar */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around overflow-x-auto no-scrollbar gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all flex-shrink-0 ${
                isActive ? 'text-brand-600 dark:text-brand-400 font-bold scale-105' : 'text-slate-500'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-[9px] mt-0.5 truncate max-w-[60px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Realtime Order Popup Alert mounted globally across Admin shell */}
      <NewOrderPopup
        onViewOrder={(ord) => setActivePopupOrder(ord)}
        onPrintReceipt={(ord) => setActiveReceiptOrder(ord)}
      />

      <OrderDetailsModal
        order={activePopupOrder}
        onClose={() => setActivePopupOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onPrintReceipt={(ord) => setActiveReceiptOrder(ord)}
      />

      <ReceiptModal
        order={activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
      />
    </div>
  );
};
