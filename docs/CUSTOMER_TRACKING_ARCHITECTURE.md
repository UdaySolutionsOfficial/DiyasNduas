# Customer Order Tracking & Synchronization Architecture

## 1. Zero Customer Account / Login Principle
Customer order placement, local order history, and tracking require **no account creation or passwords**.

## 2. Browser Device Persistence Layer (`MyOrders.tsx`)
- Order reference IDs are saved locally in browser `localStorage` under `ck_recent_orders_v1`.
- "My Orders" displays orders saved on the current browser/device.
- **Reference Removal**: Choosing "Remove from this device" clears the local reference from browser storage without deleting the authoritative order document in Firestore.

## 3. Realtime Single-Order Listener (`subscribeToOrder`)
- **Query Scope**: Listens ONLY to the specific requested order document (`where('orderId', '==', targetId)`).
- **Zero Full-Collection Listens**: Does not fetch or listen to unrelated orders.
- **Clean Unsubscribe**: Automatically unsubscribes on component unmount (`useEffect` cleanup).

## 4. Customer/Admin End-to-End Status Synchronization
- Status Lifecycle: `Pending` $\rightarrow$ `Confirmed` $\rightarrow$ `Processing` $\rightarrow$ `Ready` $\rightarrow$ `Delivered` / `Cancelled`.
- When Admin changes status in Admin Dashboard, Customer viewing `/order/:orderId` receives instant live status timeline updates with in-page toast notifications.

## 5. Immutable Historical Snapshots
- Product names, selling prices, and totals are rendered from immutable snapshot arrays inside the order document.
- Future catalog price edits or product renames by admin do **not** alter historical order receipts or customer tracking views.
