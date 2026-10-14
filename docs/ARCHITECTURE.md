# Architecture Specification

## Directory Structure Strategy
```
src/
├── admin/            # Protected admin space (Login, Dashboard, Products, Orders, Banners, Categories, Settings)
├── customer/         # Public mobile-first customer space (Home, Products, Details, Search, Wishlist, Cart, Checkout, Confirmation, Track)
├── components/       # Shared UI components (Button, Card, Badge, Loading, Modal, EmptyState)
├── config/           # Safe environment & config parsing
├── constants/        # Route constants & app keys
├── contexts/         # ThemeContext, ToastContext, AuthContext
├── firebase/         # Firebase app, db, rtdb, auth, storage exports
├── hooks/            # Custom hooks
├── layouts/          # Root layouts
├── services/         # Firebase service abstraction layer
├── styles/           # Design tokens, theme variables, gradient CSS
├── types/            # TypeScript interfaces (Product, Category, Order, Banner, Settings, Admin)
└── utils/            # Local storage helper, Order ID generator (CK-DDMMYY-XXXXX), Formatters
```

## UI & Language Boundary Rule
No technical database terminology (e.g. `Firestore document`, `collection`, `listener`, `RTDB node`, `mutation`) is exposed to users or admins. UI text strictly uses business concepts (e.g., `Products`, `Orders`, `Stock`, `Categories`, `Receipts`).
