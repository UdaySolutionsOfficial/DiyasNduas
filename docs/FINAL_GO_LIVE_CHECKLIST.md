# Final Go-Live Checklist — Crackers King

## 1. Security Checklist
- [x] Firestore security rules manifest (`firestore.rules`) verified.
- [x] Realtime Database security rules manifest (`database.rules.json`) verified.
- [x] Firebase Storage security rules manifest (`storage.rules`) verified.
- [x] Admin authorization enforced server-side via Firebase Auth.
- [x] Zero private secrets or API service account keys committed in repository.
- [x] Input sanitization and negative price/stock protection verified.
- [x] Atomic Firestore order transaction & stock reduction (`runTransaction`) verified.

## 2. Database & Inventory Checklist
- [x] Firestore collections documented (`products`, `orders`, `banners`, `categories`, `announcements`, `settings`).
- [x] RTDB paths documented (`events/new_orders`).
- [x] Atomic stock reduction on order placement verified.
- [x] Atomic stock restoration on order cancellation verified.

## 3. Customer Shopping & Tracking Checklist
- [x] Product search, category filters, and product details modal working.
- [x] Cart and Wishlist local storage persistence verified across refreshes.
- [x] Checkout validation and double-click submission lock working.
- [x] Order Confirmation screen and prefilled WhatsApp launcher working.
- [x] Single-order live status tracking and local order history page ("My Orders") working.

## 4. Admin Control Center Checklist
- [x] Admin Auth login and protected route guard working.
- [x] Dashboard overview metrics and Realtime RTDB new-order popup alert working.
- [x] Product, Category, and Banner CRUD working.
- [x] Announcement Notice management working.
- [x] Store Controls (Store Open/Closed & Accepting Orders) working.
- [x] Printable A4 order receipt preview and window.print() working.

## 5. Performance & Mobile Responsiveness Checklist
- [x] Image lazy loading (`loading="lazy"`) and aspect ratio constraints applied.
- [x] Single-order listener subscription cleanup on component unmount verified.
- [x] Minimum 44px touch targets across mobile views verified.
- [x] Tested across 320px, 375px, 768px, and 1280px viewports with zero horizontal scrolling.

## 6. Production Deployment Readiness Checklist
- [x] Environment configuration template (`.env.example`) verified.
- [x] Firebase Hosting SPA rewrites configured in `firebase.json`.
- [x] Production build (`npm run build`) succeeded cleanly in 13.37s with 0 errors.
