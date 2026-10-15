import React, { useState, useEffect } from 'react';
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
  Receipt,
  BellRing,
  Download
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { NewOrderPopup } from '../components/NewOrderPopup';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { Order, OrderStatus } from '../../types/order';
import { ordersService } from '../../services/orders.service';
import { fcmService } from '../../services/fcm.service';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const [activePopupOrder, setActivePopupOrder] = useState<Order | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [adminPushEnabled, setAdminPushEnabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const [adminDeferredPrompt, setAdminDeferredPrompt] = useState<any>(null);
  const [isAdminInstalled, setIsAdminInstalled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  });

  // Dynamic PWA Manifest & Executive Branding Switching for Admin PWA
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const manifestEl = document.getElementById('app-manifest') as HTMLLinkElement | null;
    const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
    const appleIconEl = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;
    const metaThemeEl = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;

    const originalManifest = manifestEl?.getAttribute('href') || '/manifest.json';
    const originalFavicon = faviconEl?.getAttribute('href') || '/logo.png';
    const originalAppleIcon = appleIconEl?.getAttribute('href') || '/logo.png';
    const originalTheme = metaThemeEl?.getAttribute('content') || '#F59E0B';
    const originalTitle = document.title;

    // Switch to dedicated Admin PWA manifest & icon
    if (manifestEl) manifestEl.setAttribute('href', '/manifest-admin.json');
    if (faviconEl) faviconEl.setAttribute('href', '/admin-icon.png');
    if (appleIconEl) appleIconEl.setAttribute('href', '/admin-icon.png');
    if (metaThemeEl) metaThemeEl.setAttribute('content', '#0F172A');
    document.title = 'DND Admin — Store Command Center';

    return () => {
      // Restore customer store branding on leave
      if (manifestEl) manifestEl.setAttribute('href', originalManifest);
      if (faviconEl) faviconEl.setAttribute('href', originalFavicon);
      if (appleIconEl) appleIconEl.setAttribute('href', originalAppleIcon);
      if (metaThemeEl) metaThemeEl.setAttribute('content', originalTheme);
      document.title = originalTitle;
    };
  }, []);

  // Listen for native Admin PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setAdminDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAdminInstalled(true);
      setAdminDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Auto-register admin device on login/mount if notification permission was previously granted
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        fcmService.registerAdminDeviceToken().then((res) => {
          if (res.success) setAdminPushEnabled(true);
        });
      }
    }
  }, []);

  const handleEnableAdminPush = async () => {
    const res = await fcmService.registerAdminDeviceToken();
    if (res.success) {
      setAdminPushEnabled(true);
    }
  };

  const handleInstallAdminApp = async () => {
    if (adminDeferredPrompt) {
      try {
        adminDeferredPrompt.prompt();
        const { outcome } = await adminDeferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsAdminInstalled(true);
        }
      } catch (err) {
        console.warn('Admin PWA prompt error:', err);
      } finally {
        setAdminDeferredPrompt(null);
      }
    } else {
      alert('To install DND Admin App:\n• Chrome / Edge: Click the install icon (⊕) in address bar, or Menu ➔ "Install DND Admin"\n• Android Chrome: Tap (⋮) ➔ "Install App" / "Add to Home screen"\n• iPhone / Safari: Tap Share (📤) ➔ "Add to Home Screen"');
    }
  };

  const navItems = [
    { label: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
    { label: 'Products', path: ROUTES.ADMIN.PRODUCTS, icon: Package },
    { label: 'Orders', path: ROUTES.ADMIN.ORDERS, icon: ShoppingBag },
    { label: 'Push Campaigns', path: ROUTES.ADMIN.CAMPAIGNS, icon: BellRing },
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
          <Link to={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-3 px-2 group">
            <img
              src="/admin-icon.png"
              alt="DND Admin Icon"
              className="w-11 h-11 rounded-2xl object-cover shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-black text-base tracking-tight bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent block">
                DIYAS N DUAS
              </span>
              <span className="block text-[9px] tracking-widest text-slate-400 font-bold uppercase -mt-0.5">
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
        <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* Admin PWA Standalone Install Button */}
          {!isAdminInstalled && (
            <div className="px-1">
              <button
                onClick={handleInstallAdminApp}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/30 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold shadow-sm transition-all group"
                title="Install dedicated DND Admin App on your desktop or mobile"
              >
                <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform text-amber-500" />
                <span>Install Admin App</span>
              </button>
            </div>
          )}

          {/* Admin Push Alert Device Status / Trigger */}
          <div className="px-1">
            {adminPushEnabled ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Device Push Alerts Active</span>
              </div>
            ) : (
              <button
                onClick={handleEnableAdminPush}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-sm transition-all"
                title="Receive order notifications even when phone is locked or browser is closed"
              >
                <BellRing className="w-3.5 h-3.5 animate-bounce" />
                <span>Enable Order Push Alerts</span>
              </button>
            )}
          </div>

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
          <img src="/admin-icon.png" alt="DIYAS N DUAS" className="w-7 h-7 rounded-lg object-cover ring-1 ring-amber-400" />
          <span className="font-extrabold text-sm tracking-tight">DIYAS N DUAS</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isAdminInstalled && (
            <button
              onClick={handleInstallAdminApp}
              className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1 shadow-sm"
              title="Install DND Admin App"
            >
              <Download className="w-3 h-3 text-amber-500" />
              <span>Install</span>
            </button>
          )}

          {!adminPushEnabled ? (
            <button 
              onClick={handleEnableAdminPush} 
              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
              title="Enable instant order push notifications on this phone"
            >
              <BellRing className="w-3 h-3" />
              <span>Alerts</span>
            </button>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-800" title="Order alerts active on this device"></span>
          )}
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
