# Data Model Specifications

## TypeScript & Database Entities

### 1. Product Interface (`src/types/product.ts`)
- `id`: Unique product ID
- `name`: Product title (e.g. "10cm Electric Sparklers")
- `description`: Detailed description
- `categoryId`: Foreign reference ID to category
- `originalPrice`: MRP price in INR
- `sellingPrice`: Discounted store selling price in INR
- `stockQuantity`: Current available stock
- `images`: Array of image URLs
- `badge`: Promotional highlight string (e.g. "Bestseller")
- `isActive`: Flag indicating visibility in store
- `isFeatured`: Flag for featured homepage placement
- `createdAt`, `updatedAt`: Timestamps

### 2. Order & Item Snapshot Interface (`src/types/order.ts`)
- `id`: Firestore document ID
- `orderId`: Human-readable reference (e.g. `CK-260824-00127`)
- `customerInfo`: Object containing fullName, phone, address, city, pincode, notes
- `items`: Array of `OrderItemSnapshot` items (productId, name, unitPrice, originalUnitPrice, quantity, image, subtotal). *Crucial*: Stores immutable snapshots of product name and price at the exact moment of order placement.
- `subtotal`, `discountAmount`, `deliveryFee`, `total`: Calculated financial totals
- `orderStatus`: Order state (`pending`, `confirmed`, `processing`, `ready`, `delivered`, `cancelled`)
- `statusHistory`: Chronological log of status updates

### 3. Category Interface (`src/types/category.ts`)
- `id`, `name`, `description`, `image`, `isActive`, `displayOrder`

### 4. Banner Interface (`src/types/banner.ts`)
- `id`, `title`, `subtitle`, `imageUrl`, `buttonText`, `buttonUrl`, `isActive`, `displayOrder`

### 5. Store Settings Interface (`src/types/settings.ts`)
- Store contact phone, address, min order value, notice banner message, store open status.
