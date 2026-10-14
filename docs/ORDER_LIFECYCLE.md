# Order Lifecycle & Stock Transaction Specification

## Order Flow Diagram
```
Customer Checkout Request
           ↓
Form & Cart Validation
           ↓
Atomic Firestore Transaction (runTransaction)
├── Read authoritative product stock & prices
├── Validate stock >= requested quantity
├── Create immutable OrderItemSnapshots
├── Decrement product stock (stockQuantity - quantity)
└── Write order document with status 'pending'
           ↓
Save Order Reference in Browser LocalStorage
           ↓
Clear Ordered Cart Items
           ↓
Dispatch RTDB Realtime Notification Event
           ↓
Open Prefilled WhatsApp Message to Customer Phone
           ↓
Admin Dashboard Receives Realtime Alert Popup
           ↓
Admin Confirms / Manages Order Status:
'pending' → 'confirmed' → 'processing' → 'ready' → 'delivered'
           │
           └── (If Cancelled) → Atomic Stock Restoration
```

## Status Transitions & Stock Policy
- **Pending**: Initial state upon customer order request submission. Stock is reserved/decremented atomically during order creation.
- **Confirmed**: Verified by admin. Triggers WhatsApp confirmation message link.
- **Processing**: Crackers items packaged in transport boxes.
- **Ready**: Parcel ready for despatch.
- **Delivered**: Order request fulfilled.
- **Cancelled**: Admin cancels order request $\rightarrow$ Atomically restores ordered item quantities back into product stock records (executed exactly once).
