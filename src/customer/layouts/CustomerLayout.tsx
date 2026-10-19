import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Grid,
  Heart,
  ShoppingBag,
  Package,
  Sun,
  Moon,
  PhoneCall,
  Clock
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useToast } from '../../contexts/ToastContext';
import { localStorageUtil } from '../../utils/localStorage';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { PWAInstallModal } from '../components/PWAInstallModal';
import { NotificationPromptModal } from '../components/NotificationPromptModal';
import { FestiveBackgroundCanvas } from '../../components/common/FestiveBackgroundCanvas';
import { env } from '../../config/env';
import { settingsService } from '../../services/settings.service';
import { fcmService } from '../../services/fcm.service';
import { StoreSettings } from '../../types/settings';

export const CustomerLayout: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const toast = useToast();

  const [recentOrderCount, setRecentOrderCount] = useState(0);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Surface visual in-app banner toast when notifications fire while browsing
  useEffect(() => {
    const handleInAppNotif = (e: any) => {
      const data = e.detail;
      if (data && data.title) {
        toast.info(data.title, data.body || '');
      }
    };
    window.addEventListener('dnd_inapp_notification', handleInAppNotif);
    return () => {
      window.removeEventListener('dnd_inapp_notification', handleInAppNotif);
    };
  }, []);

  useEffect(() => {
    const unsubscribeSettings = settingsService.subscribeToStoreSettings((data) => {
      setSettings(data);
    });

    const recentOrders = localStorageUtil.getRecentOrders();
    const recentOrderIds = recentOrders.map((o) => o.orderId);

    // Listen to real-time foreground broadcast announcements & customer order push events
    const unsubscribeFCM = fcmService.subscribeToCustomerEvents(recentOrderIds, (eventData) => {
      fcmService.displayLocalNotification({
        title: eventData.title,
        body: eventData.body,
        image: eventData.image,
        url: eventData.url || '/products',
        tag: eventData.tag,
      });
    });

    return () => {
      unsubscribeSettings();
      unsubscribeFCM();
    };
  }, [recentOrderCount]);

  useEffect(() => {
    const updateCount = () => {
      setRecentOrderCount(localStorageUtil.getRecentOrders().length);
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('ck_recent_orders_updated', updateCount);

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('ck_recent_orders_updated', updateCount);
    };
  }, [location.pathname]);

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  const navItems = [
    { label: 'Home', path: ROUTES.CUSTOMER.HOME, icon: Home },
    { label: 'Catalog', path: ROUTES.CUSTOMER.PRODUCTS, icon: Grid },
    { label: 'Wishlist', path: ROUTES.CUSTOMER.WISHLIST, icon: Heart, badge: wishlistCount },
    { label: 'Cart', path: ROUTES.CUSTOMER.CART, icon: ShoppingBag, badge: cartCount },
    { label: 'My Orders', path: ROUTES.CUSTOMER.MY_ORDERS, icon: Clock, badge: recentOrderCount },
    { label: 'Track', path: ROUTES.CUSTOMER.TRACK_ORDER, icon: Package },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-20 md:pb-0 relative">
      {/* 60fps Ambient Particle Background Canvas */}
      <FestiveBackgroundCanvas />

      {/* Dynamic Announcement Bar */}
      <AnnouncementBar />

      {/* Customer Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to={ROUTES.CUSTOMER.HOME} className="flex items-center gap-2.5 group">
            <img
              src={settings?.logoUrl || "/logo.png"}
              alt="Diyas N Duas Logo"
              className="w-10 h-10 rounded-full object-cover shadow-md shadow-brand-500/25 ring-2 ring-gold-400/50 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-maroon-700 via-terracotta-500 to-gold-500 dark:from-gold-300 dark:via-terracotta-400 dark:to-maroon-300 bg-clip-text text-transparent block">
                Diyas n duas
              </span>
              <span className="block text-[10px] tracking-wide text-terracotta-600 dark:text-gold-400 font-semibold -mt-0.5">
                Terracotta Diyas Store
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Animated Active Background Pill */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium bg-slate-100/70 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-300 ${isActive
                    ? 'bg-brand-500 text-white font-extrabold shadow-md shadow-brand-500/30 scale-105 z-10'
                    : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-slate-800/80'
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className={`px-1.5 py-0.2 text-[10px] font-black rounded-full shadow-xs ${isActive ? 'bg-white text-brand-600' : 'bg-brand-500 text-white'
                      }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-pointer"
              aria-label="Toggle Theme Mode"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Dynamic Store Phone Call Action (Desktop & Mobile) */}
            <a
              href={`tel:${(settings?.contactPhone || settings?.whatsappNumber || env.store.supportPhone).replace(/[^\d+]/g, '')}`}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors shadow-xs"
              title={`Call Store: ${settings?.contactPhone || settings?.whatsappNumber || env.store.supportPhone}`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>{settings?.contactPhone || settings?.whatsappNumber || env.store.supportPhone}</span>
            </a>

            <a
              href={`tel:${(settings?.contactPhone || settings?.whatsappNumber || env.store.supportPhone).replace(/[^\d+]/g, '')}`}
              className="sm:hidden p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors shadow-xs"
              aria-label={`Call Store: ${settings?.contactPhone || settings?.whatsappNumber || env.store.supportPhone}`}
              title={`Call Store: ${settings?.contactPhone || settings?.whatsappNumber || env.store.supportPhone}`}
            >
              <PhoneCall className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* Premium Dynamic Pop-Up Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 flex items-center justify-around shadow-2xl h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          if (isActive) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative -top-4 flex flex-col items-center group transition-all duration-300 z-10"
              >
                <div className="w-12 h-12 rounded-full bg-hero-gradient flex items-center justify-center text-white shadow-lg shadow-brand-500/40 ring-4 ring-white dark:ring-slate-900 transition-all duration-300 scale-110">
                  <item.icon className="w-5 h-5 text-white" />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-black rounded-full bg-amber-400 text-slate-950 shadow-sm ring-2 ring-white dark:ring-slate-900">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-black tracking-tight text-brand-600 dark:text-brand-400 block">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center py-1 px-2.5 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-brand-500 transition-all duration-300"
            >
              <div className="relative flex flex-col items-center">
                <item.icon className="w-5 h-5" />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-brand-500 text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-1 font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* First-Time PWA App Install Promo Modal */}
      <PWAInstallModal />

      {/* Super Animated Festive FCM Push Notification Opt-In Modal */}
      <NotificationPromptModal />
    </div>
  );
};
