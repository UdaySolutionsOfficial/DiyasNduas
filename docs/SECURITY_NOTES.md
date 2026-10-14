# Security Architecture & Business Safeguards

## 1. Zero Trust Customer Browser Operations
The customer client browser is NEVER considered authoritative for:
- Product prices or discounts
- Stock availability or deduction logic
- Calculated subtotal/total amounts

When an order request is created in future phases, the order service validates prices directly against authoritative Firestore records and updates stock inside an atomic transaction.

## 2. Race Condition & Overselling Prevention
Order creation uses Firestore `runTransaction` to:
- Check current stock quantity atomically.
- Fail transaction if stock is insufficient.
- Atomically decrement product stock and write order document simultaneously.

## 3. Protected Admin Routing & Auth
Admin routes are wrapped with `AdminRoute` guards using Firebase Authentication. Simply typing `/admin` in the address bar without valid admin authentication will redirect to `/admin/login`.
