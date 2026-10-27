import { createBrowserRouter } from 'react-router-dom';
import { CustomerLayout } from './customer/layouts/CustomerLayout';
import { AdminLayout } from './admin/layouts/AdminLayout';
import { AdminRoute } from './admin/components/AdminRoute';
import { NotFound } from './components/common/NotFound';

import { Home } from './customer/pages/Home';
import { Products } from './customer/pages/Products';
import { ProductDetails } from './customer/pages/ProductDetails';
import { Cart } from './customer/pages/Cart';
import { Wishlist } from './customer/pages/Wishlist';
import { Checkout } from './customer/pages/Checkout';
import { OrderConfirmation } from './customer/pages/OrderConfirmation';
import { TrackOrder } from './customer/pages/TrackOrder';
import { MyOrders } from './customer/pages/MyOrders';

import { Login } from './admin/pages/Login';
import { Dashboard } from './admin/pages/Dashboard';
import { AdminProducts } from './admin/pages/AdminProducts';
import { AdminCategories } from './admin/pages/AdminCategories';
import { AdminOrders } from './admin/pages/AdminOrders';
import { AdminBanners } from './admin/pages/AdminBanners';
import { AdminAnnouncements } from './admin/pages/AdminAnnouncements';
import { AdminCampaigns } from './admin/pages/AdminCampaigns';
import { AdminTaxes } from './admin/pages/AdminTaxes';
import { AdminSpecialOffers } from './admin/pages/AdminSpecialOffers';
import { AdminSettings } from './admin/pages/AdminSettings';
import { AdminRevenue } from './admin/pages/AdminRevenue';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'products', element: <Products /> },
      { path: 'products/:id', element: <ProductDetails /> },
      { path: 'cart', element: <Cart /> },
      { path: 'wishlist', element: <Wishlist /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'order-confirmation/:orderId', element: <OrderConfirmation /> },
      { path: 'order', element: <TrackOrder /> },
      { path: 'order/:orderId', element: <TrackOrder /> },
      { path: 'track-order', element: <TrackOrder /> },
      { path: 'track-order/:orderId', element: <TrackOrder /> },
      { path: 'track', element: <TrackOrder /> },
      { path: 'track/:orderId', element: <TrackOrder /> },
      { path: 'tracking', element: <TrackOrder /> },
      { path: 'tracking/:orderId', element: <TrackOrder /> },
      { path: 'my-orders', element: <MyOrders /> },
      { path: 'orders', element: <MyOrders /> },
    ],
  },
  {
    path: '/admin/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'banners', element: <AdminBanners /> },
      { path: 'announcements', element: <AdminAnnouncements /> },
      { path: 'campaigns', element: <AdminCampaigns /> },
      { path: 'taxes', element: <AdminTaxes /> },
      { path: 'special-offers', element: <AdminSpecialOffers /> },
      { path: 'revenue', element: <AdminRevenue /> },
      { path: 'analytics', element: <AdminRevenue /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
