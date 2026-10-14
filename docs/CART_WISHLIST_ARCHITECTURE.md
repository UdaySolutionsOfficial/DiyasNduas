# Cart & Wishlist Architecture Specification

## 1. Local Temporary Shopping State Principle
Cart and Wishlist operations are customer-side temporary shopping states.
- **Zero Firestore Writes**: Adding items, toggling wishlist, updating quantities, or clearing the cart generates **zero Firestore network writes**.
- **Browser Persistence**: Local persistence is handled via browser `localStorage` (`ck_cart_v1` and `ck_wishlist_v1`).

## 2. Non-Authoritative Client Data Rule
- **Client Non-Authority**: The local cart is designed strictly for UX presentation. Prices, stock quantities, and subtotals saved in `localStorage` are **never trusted as authoritative** for order generation.
- **Server Revalidation**: In future order processing phases, order creation revalidates product existence, current selling price, and stock levels inside an atomic Firestore transaction.

## 3. Data Schema & Duplicate Line Prevention
- **Cart Line Schema**: `{ product, quantity, addedAt }`.
- **Duplicate Line Prevention**: Adding an already existing product increments the quantity of the existing line item instead of creating duplicate line entries.

## 4. Financial Calculations
- `Item Subtotal = Selling Price × Quantity`
- `Cart Subtotal = Sum(Item Subtotal)`
- `Original Total = Sum(Original Price × Quantity)`
- `Total Savings = Original Total - Cart Subtotal`
