# Firebase Architecture & Service Responsibilities

## Service Division

### 1. Cloud Firestore (Primary Business Data Store)
- **Products**: Main product document collection (`products`).
- **Categories**: Category metadata & display sequence (`categories`).
- **Orders**: Persistent historical customer order records (`orders`).
- **Banners**: Store banner & offer slides (`banners`).
- **Settings**: Business configuration (`settings/store_config`).

### 2. Firebase Realtime Database (Lightweight Event Bus)
- **New Order Notifications**: Real-time push events to `events/new_orders` when a customer places an order.
- **Admin Alerts**: Instant notification triggers for admin dashboard badge alerts (`notifications/latest_order`).
- **Order Status Stream**: Live status updates for tracking (`order_updates/{orderId}`).
- *Note*: Firestore database contents are NOT duplicated inside RTDB.

### 3. Firebase Storage
- Product showcase images (`products/{id}_{timestamp}_{name}`).
- Banner images (`banners/banner_{timestamp}_{name}`).

### 4. Firebase Authentication
- Administrator credentials and session authentication. Customer accounts are NOT required.
