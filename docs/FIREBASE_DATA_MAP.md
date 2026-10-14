# Firebase Data Structure Map

## 1. Cloud Firestore Collections

### `products` Collection
- `id`: string (document ID)
- `name`: string
- `description`: string
- `categoryId`: string
- `categoryName`: string
- `originalPrice`: number
- `sellingPrice`: number
- `stockQuantity`: number
- `images`: string[]
- `badge`: string (optional)
- `isActive`: boolean
- `isFeatured`: boolean
- `createdAt`: number (timestamp)
- `updatedAt`: number (timestamp)

### `orders` Collection
- `id`: string (document ID)
- `orderId`: string (human-readable ID, e.g. `CK-240826-58921`)
- `customerInfo`: `{ fullName, phone, address, notes }`
- `items`: `OrderItemSnapshot[]` (`{ productId, name, unitPrice, originalUnitPrice, quantity, image, subtotal }`)
- `itemCount`: number
- `subtotal`: number
- `discountAmount`: number
- `deliveryFee`: number
- `total`: number
- `orderStatus`: string (`'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled'`)
- `statusHistory`: `StatusHistoryItem[]` (`{ status, timestamp, note }`)
- `createdAt`: number (timestamp)
- `updatedAt`: number (timestamp)

### `categories` Collection
- `id`: string, `name`: string, `description`: string, `displayOrder`: number, `isActive`: boolean

### `banners` Collection
- `id`: string, `title`: string, `subtitle`: string, `imageUrl`: string, `buttonText`: string, `buttonUrl`: string, `displayOrder`: number, `isActive`: boolean

## 2. Realtime Database (RTDB) Paths
- `/events/new_orders/{eventId}`: `{ orderId, customerName, totalAmount, timestamp }`
- `/notifications/latest_order`: `{ orderId, customerName, totalAmount, timestamp }`
