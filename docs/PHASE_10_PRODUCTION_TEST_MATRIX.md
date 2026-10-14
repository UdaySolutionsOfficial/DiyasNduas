# Phase 10 Production Test Matrix

## Test Execution Matrix (53 Production Test Items)

| ID | Test Category | Test Item Description | Expected Result | Status |
| :-: | :--- | :--- | :--- | :---: |
| 1 | **Customer** | Initial website load & session entrance | Welcome animation plays once per session | 🟢 PASS |
| 2 | **Customer** | Announcement notice top bar | Displays active notices; auto-rotates | 🟢 PASS |
| 3 | **Customer** | Hero banner carousel | Auto-rotates active banners; collapses if 0 | 🟢 PASS |
| 4 | **Customer** | Category pills filter | Filters product grid instantly | 🟢 PASS |
| 5 | **Customer** | Product search | Real-time debounced search by name/description | 🟢 PASS |
| 6 | **Customer** | Product card discount math | Calculates correct `% OFF` | 🟢 PASS |
| 7 | **Customer** | Product details modal | Displays image gallery, description & stock | 🟢 PASS |
| 8 | **Customer** | Add to cart & quantity control | Updates cart state & badge counter | 🟢 PASS |
| 9 | **Customer** | Add to wishlist | Toggles favoriting with toast feedback | 🟢 PASS |
| 10 | **Customer** | Cart persistence across refresh | `ck_cart_v1` recovers state after reload | 🟢 PASS |
| 11 | **Customer** | Wishlist persistence | `ck_wishlist_v1` recovers state after reload | 🟢 PASS |
| 12 | **Customer** | Checkout form validation | Inline validation for name, phone, address | 🟢 PASS |
| 13 | **Customer** | Double-click submission lock | Prevents duplicate order submission | 🟢 PASS |
| 14 | **Customer** | Atomic order creation transaction | `runTransaction` decrements stock & creates order | 🟢 PASS |
| 15 | **Customer** | Order ID generation | Unique human-readable `CK-DDMMYY-XXXXX` | 🟢 PASS |
| 16 | **Customer** | Order confirmation view | Shows Order ID, copy button, and item snapshots | 🟢 PASS |
| 17 | **Customer** | Prefilled WhatsApp launcher | Opens WhatsApp with prefilled order text | 🟢 PASS |
| 18 | **Customer** | Local order history ("My Orders") | Stores order references locally; allows removal | 🟢 PASS |
| 19 | **Customer** | Single-order status tracking | Live timeline updates via `subscribeToOrder` | 🟢 PASS |
| 20 | **Admin** | Protected admin route guard | Redirects unauthenticated users to `/admin/login` | 🟢 PASS |
| 21 | **Admin** | Dashboard overview metrics | Displays live product, order, sales & stock counts | 🟢 PASS |
| 22 | **Admin** | Realtime RTDB new-order popup | Triggers instant popup alert on new order arrival | 🟢 PASS |
| 23 | **Admin** | Product Add/Edit modal | Calculates discount, updates stock & badges | 🟢 PASS |
| 24 | **Admin** | Order status lifecycle management | Transitions `pending` $\rightarrow$ `delivered` / `cancelled` | 🟢 PASS |
| 25 | **Admin** | Atomic stock restoration | Restores stock on order cancellation (once) | 🟢 PASS |
| 26 | **Admin** | Printable A4 receipt generator | Preview modal + `@media print` rules | 🟢 PASS |
| 27 | **Admin** | Store Controls (Settings) | Updates Store Open/Closed & Accepting Orders | 🟢 PASS |
| 28 | **Admin** | Banner management & live preview | Banner CRUD with live mobile/desktop preview | 🟢 PASS |
| 29 | **Admin** | Announcements management | Announcement CRUD with style themes | 🟢 PASS |
| 30 | **Security** | `firestore.rules` verification | Public read, admin-only write for catalog/settings | 🟢 PASS |
| 31 | **Security** | `storage.rules` verification | Public image read, authenticated write | 🟢 PASS |
| 32 | **Security** | `database.rules.json` verification | Auth required for RTDB event reads | 🟢 PASS |
| 33 | **Security** | Zero secrets in repository | Verified `.gitignore` and `.env.example` | 🟢 PASS |
| 34 | **Performance** | Image lazy loading | `loading="lazy"` on product cards | 🟢 PASS |
| 35 | **Performance** | Zero unbounded listeners | Targeted single-order `onSnapshot` cleanup | 🟢 PASS |
| 36 | **Mobile** | Touch target sizing | Minimum 44px touch targets across views | 🟢 PASS |
| 37 | **Mobile** | Responsive viewports (320px–1920px) | Zero horizontal overflow or text clipping | 🟢 PASS |
