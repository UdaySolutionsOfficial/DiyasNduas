# Admin Dashboard Architecture & Receipt Printing Specification

## 1. Overview
The Crackers King Admin Panel ([`src/admin/`](file:///C:/Users/DELL/.gemini/antigravity/scratch/crackers-king/src/admin)) is designed for store management: dashboard metrics, realtime order alert popups, product CRUD, banner management, order status transitions, atomic stock restoration, and printable A4 receipts.

## 2. Realtime Order Alert Popup (`NewOrderPopup.tsx`)
- **RTDB Event Listener**: Listens to Realtime Database `events/new_orders` and `notifications/latest_order`.
- **Event Acknowledgment**: When a new customer order is placed, an unread notification event triggers a modal overlay across any active admin page with Order ID, customer details, and total bill.
- **Quick Triggers**: Provides "View Details" and "Print Receipt" triggers.

## 3. Product & Stock Management (`AdminProducts.tsx` & `ProductModal.tsx`)
- **Automatic Discount Math**: `Discount % = Math.round(((MRP - Selling) / MRP) * 100)`. Admin enters original price and selling price; discount is calculated dynamically.
- **Stock Management**: Instant stock updates reflected in Firestore.
- **Active & Featured Toggles**: Hides inactive products from customer browsing without deleting historical product snapshot references.

## 4. Order Lifecycle & Atomic Stock Restoration (`AdminOrders.tsx` & `OrderDetailsModal.tsx`)
- **Status Lifecycle**: `Pending` $\rightarrow$ `Confirmed` $\rightarrow$ `Preparing` $\rightarrow$ `Ready` $\rightarrow$ `Delivered` / `Cancelled`.
- **Atomic Stock Restoration**: Cancelling an order restores the ordered item quantities back into product stock records.
- **WhatsApp Customer Messaging**: Generates prefilled WhatsApp confirmation link (`https://wa.me/91XXXXXXXXXX?text=...`) directed to the customer's mobile number.

## 5. Printable A4 Order Receipt (`ReceiptModal.tsx`)
- **Print Optimization**: Uses CSS `@media print` rules in `theme.css`.
- Hides all admin UI elements, navigation bars, headers, and modal backdrops, generating clean A4 printable document output with Crackers King header, Order ID, customer details, item breakdown table, savings, and total bill.
